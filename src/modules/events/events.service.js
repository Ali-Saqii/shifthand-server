const AppError = require('../../lib/AppError');

function models() {
  return require('../../db/models');
}

function validateTimeRange(startsAt, endsAt) {
  if (new Date(endsAt) <= new Date(startsAt)) {
    throw new AppError('End time must be after start time', 400, 'INVALID_TIME_RANGE');
  }
}

async function findOrganizationEvent(organizationId, eventId) {
  const { Event } = models();
  const event = await Event.findOne({ where: { id: eventId, organizationId } });
  if (!event) {
    throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
  }
  return event;
}

async function create(organizationId, data) {
  validateTimeRange(data.startsAt, data.endsAt);
  const { Event } = models();
  return Event.create({ organizationId, ...data });
}

async function list(organizationId) {
  const { Event } = models();
  return Event.findAll({ where: { organizationId }, order: [['startsAt', 'ASC']] });
}

async function get(organizationId, eventId) {
  return findOrganizationEvent(organizationId, eventId);
}

async function update(organizationId, eventId, data) {
  const event = await findOrganizationEvent(organizationId, eventId);
  const startsAt = data.startsAt || event.startsAt;
  const endsAt = data.endsAt || event.endsAt;
  validateTimeRange(startsAt, endsAt);
  await event.update(data);
  return event;
}

async function remove(organizationId, eventId) {
  const event = await findOrganizationEvent(organizationId, eventId);
  await event.destroy();
}

module.exports = { create, list, get, update, remove, findOrganizationEvent };