const authService = require('./auth.service');
const { sendData } = require('../../lib/respond');

async function me(req, res, next) {
  try {
    sendData(res, await authService.me(req.user.id));
  } catch (error) {
    next(error);
  }
}

module.exports = { me };
