const signupService = require('./signups.service');
const { sendData } = require('../../lib/respond');

async function list(req, res, next) {
  try {
    sendData(res, await signupService.list(req.params.shiftId));
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    sendData(res, await signupService.create(req.params.shiftId, req.user.id), 201);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await signupService.remove(req.params.shiftId, req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { list, create, remove };