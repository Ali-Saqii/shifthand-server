const eventService = require('./events.service');
const { sendData } = require('../../lib/respond');

async function create(req, res, next) {
  try {
    sendData(res, await eventService.create(req.params.organizationId, req.body), 201);
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const result = await eventService.list(req.params.organizationId, req.query);
    sendData(res, result.items, 200, { nextCursor: result.nextCursor });
  } catch (error) {
    next(error);
  }
}

async function get(req, res, next) {
  try {
    sendData(res, await eventService.get(req.params.organizationId, req.params.eventId));
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    sendData(res, await eventService.update(
      req.params.organizationId,
      req.params.eventId,
      req.body
    ));
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await eventService.remove(req.params.organizationId, req.params.eventId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function publish(req, res, next) {
  try {
    sendData(res, await eventService.publish(req.params.organizationId, req.params.eventId));
  } catch (error) {
    next(error);
  }
}

async function cancel(req, res, next) {
  try {
    sendData(res, await eventService.cancel(req.params.organizationId, req.params.eventId));
  } catch (error) {
    next(error);
  }
}

async function getPublic(req, res, next) {
  try {
    sendData(res, await eventService.getPublic(req.params.publicSlug));
  } catch (error) {
    next(error);
  }
}

module.exports = { create, list, get, update, remove, publish, cancel, getPublic };