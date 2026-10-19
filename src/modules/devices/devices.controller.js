const deviceService = require('./devices.service');
const { sendData } = require('../../lib/respond');

async function register(req, res, next) {
  try {
    sendData(res, await deviceService.register(
      req.user.id,
      req.body.token,
      req.body.platform
    ), 201);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await deviceService.remove(req.user.id, req.body.token);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { register, remove };