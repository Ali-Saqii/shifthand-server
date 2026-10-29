const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');

function createAccessToken(user) {
  return jwt.sign({ sub: user.id, type: 'access' }, config.jwt.accessSecret, { expiresIn: config.jwt.accessTtl });
}

function createRefreshToken(user) {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  hashToken,
  verifyAccessToken
};
