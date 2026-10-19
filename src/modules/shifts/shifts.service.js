const AppError = require('../../lib/AppError');

function models() {
  return require('../../db/models');
}

function validateTimeRange(startsAt, endsAt) {
  if (new Date(endsAt) <= new Date(startsAt)) {
    throw new AppError('End time must be after start time', 400, 'INVALID_TIME_RANGE');
  }
}

async function findEvent(eventId) {
  const { Event } = models();
  const event = await Event.findByPk(eventId);
  if (!event) {
    throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
  }
  return event;
}

async function findShift(eventId, shiftId) {
  const { Shift } = models();
  const shift = await Shift.findOne({ where: { id: shiftId, eventId } });
  if (!shift) {
    throw new AppError('Shift not found', 404, 'SHIFT_NOT_FOUND');
  }
  return shift;
}

async function create(eventId, data) {
  const event = await findEvent(eventId);
  validateTimeRange(data.startsAt, data.endsAt);
  if (new Date(data.startsAt) < new Date(event.startsAt) || new Date(data.endsAt) > new Date(event.endsAt)) {
    throw new AppError('Shift must fit within event times', 400, 'SHIFT_OUTSIDE_EVENT');
  }
  const { Shift } = models();
  return Shift.create({ eventId, ...data });
}

async function list(eventId) {
  await findEvent(eventId);
  const { Shift } = models();
  return Shift.findAll({ where: { eventId }, order: [['startsAt', 'ASC']] });
}

async function get(eventId, shiftId) {
  return findShift(eventId, shiftId);
}

async function update(eventId, shiftId, data) {
  const shift = await findShift(eventId, shiftId);
  const event = await findEvent(eventId);
  const startsAt = data.startsAt || shift.startsAt;
  const endsAt = data.endsAt || shift.endsAt;
  validateTimeRange(startsAt, endsAt);
  if (new Date(startsAt) < new Date(event.startsAt) || new Date(endsAt) > new Date(event.endsAt)) {
    throw new AppError('Shift must fit within event times', 400, 'SHIFT_OUTSIDE_EVENT');
  }
  await shift.update(data);
  return shift;
}

async function remove(eventId, shiftId) {
  const shift = await findShift(eventId, shiftId);
  await shift.destroy();
}

module.exports = { create, list, get, update, remove };