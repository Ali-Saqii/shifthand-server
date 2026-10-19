const shiftService = require('./shifts.service');
const { sendData } = require('../../lib/respond');

async function create(req, res, next) {
  try {
    sendData(res, await shiftService.create(req.params.eventId, req.body), 201);
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    sendData(res, await shiftService.list(req.params.eventId));
  } catch (error) {
    next(error);
  }
}

async function get(req, res, next) {
  try {
    sendData(res, await shiftService.get(req.params.eventId, req.params.shiftId));
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    sendData(res, await shiftService.update(
      req.params.eventId,
      req.params.shiftId,
      req.body
    ));
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await shiftService.remove(req.params.eventId, req.params.shiftId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { create, list, get, update, remove };