const AppError = require('../../lib/AppError');
const { Op } = require('sequelize');

function models() {
  return require('../../db/models');
}

function validateTimeRange(startsAt, endsAt) {
  if (Number.isNaN(new Date(startsAt).getTime()) || Number.isNaN(new Date(endsAt).getTime())) {
    throw new AppError('Event dates must be valid', 400, 'INVALID_EVENT_DATES');
  }
  if (new Date(endsAt) <= new Date(startsAt)) {
    throw new AppError('End time must be after start time', 400, 'INVALID_TIME_RANGE');
  }
}

function slugBase(title) {
  return title.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150) || 'event';
}

async function createUniqueSlug(Event, title) {
  const base = slugBase(title);
  let slug = base;
  for (let suffix = 2; ; suffix += 1) {
    const existing = await Event.findOne({ where: { publicSlug: slug }, attributes: ['id'] });
    if (!existing) return slug;
    slug = `${base}-${suffix}`.slice(0, 180);
  }
}

function encodeCursor(event) {
  return Buffer.from(JSON.stringify({
    startsAt: new Date(event.startsAt).toISOString(),
    id: event.id
  })).toString('base64url');
}

function decodeCursor(cursor) {
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (!value.id || Number.isNaN(new Date(value.startsAt).getTime())) throw new Error();
    return value;
  } catch (error) {
    throw new AppError('Invalid event cursor', 422, 'INVALID_CURSOR');
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
  const publicSlug = await createUniqueSlug(Event, data.title);
  return Event.create({ organizationId, ...data, publicSlug, status: 'draft' });
}

async function list(organizationId, { cursor, limit = 20 } = {}) {
  const { Event } = models();
  const where = { organizationId };
  if (cursor) {
    const decoded = decodeCursor(cursor);
    where[Op.or] = [
      { startsAt: { [Op.gt]: new Date(decoded.startsAt) } },
      {
        startsAt: decoded.startsAt,
        id: { [Op.gt]: decoded.id }
      }
    ];
  }
  const events = await Event.findAll({
    where,
    order: [['startsAt', 'ASC'], ['id', 'ASC']],
    limit: Number(limit) + 1
  });
  const hasNext = events.length > Number(limit);
  const items = hasNext ? events.slice(0, Number(limit)) : events;
  return { items, nextCursor: hasNext ? encodeCursor(items[items.length - 1]) : null };
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

async function publish(organizationId, eventId) {
  const event = await findOrganizationEvent(organizationId, eventId);
  if (event.status !== 'draft') {
    throw new AppError('Only draft events can be published', 409, 'INVALID_EVENT_STATUS');
  }
  await event.update({ status: 'published' });
  return event;
}

async function cancel(organizationId, eventId) {
  const event = await findOrganizationEvent(organizationId, eventId);
  if (event.status === 'cancelled' || event.status === 'completed') {
    throw new AppError('Event cannot be cancelled in its current state', 409, 'INVALID_EVENT_STATUS');
  }
  await event.update({ status: 'cancelled' });
  return event;
}

async function remove(organizationId, eventId) {
  const event = await findOrganizationEvent(organizationId, eventId);
  await event.destroy();
}

async function getPublic(publicSlug) {
  const { Event } = models();
  const event = await Event.findOne({
    where: { publicSlug, status: 'published' }
  });
  if (!event) {
    throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
  }
  return event;
}

module.exports = {
  create, list, get, update, remove, publish, cancel, getPublic, findOrganizationEvent
};