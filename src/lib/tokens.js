const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');

function createAccessToken(user) {
  return jwt.sign({ sub: user.id, type: 'access' }, config.jwt.accessSecret, { expiresIn: '15m' });
}

function createRefreshToken(user) {
  return jwt.sign({ sub: user.id, type: 'refresh', jti: crypto.randomUUID() }, config.jwt.refreshSecret, {
    expiresIn: '30d'
  });
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  hashToken,
  verifyAccessToken,
  verifyRefreshToken
};