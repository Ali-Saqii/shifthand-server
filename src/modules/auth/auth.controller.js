const authService = require('./auth.service');
const { sendData } = require('../../lib/respond');

async function register(req, res, next) {
  try {
    sendData(res, await authService.register(req.body), 201);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    sendData(res, await authService.login(req.body));
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    sendData(res, await authService.refresh(req.body.refreshToken));
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, refresh };