const AppError = require('../../lib/AppError');

function models() {
  return require('../../db/models');
}

function validateTimeRange(startsAt, endsAt) {
  if (Number.isNaN(new Date(startsAt).getTime()) || Number.isNaN(new Date(endsAt).getTime())) {
    throw new AppError('Shift dates must be valid', 400, 'INVALID_SHIFT_DATES');
  }
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

function eventBoundsError(startsAt, endsAt, event) {
  if (new Date(startsAt) < new Date(event.startsAt) ||
      new Date(endsAt) > new Date(event.endsAt)) {
    throw new AppError('Shift must fit within event times', 400, 'SHIFT_OUTSIDE_EVENT');
  }
}

async function validateLead(event, leadUserId) {
  if (!leadUserId) return;
  const { Membership } = models();
  const membership = await Membership.findOne({
    where: { organizationId: event.organizationId, userId: leadUserId }
  });
  if (!membership) {
    throw new AppError('Shift lead must belong to the organization', 422, 'INVALID_SHIFT_LEAD');
  }
}

async function activeSignupCount(shiftId) {
  const { Signup } = models();
  return Signup.count({
    where: {
      shiftId,
      status: ['unverified', 'pending', 'confirmed', 'offered']
    }
  });
}

function requireConfirmation(confirmChange, count) {
  if (count > 0 && !confirmChange) {
    throw new AppError(
      'confirmChange must be true when active signups exist',
      409,
      'SHIFT_CHANGE_CONFIRMATION_REQUIRED'
    );
  }
}

async function create(eventId, data) {
  const event = await findEvent(eventId);
  validateTimeRange(data.startsAt, data.endsAt);
  eventBoundsError(data.startsAt, data.endsAt, event);
  await validateLead(event, data.leadUserId);
  const { Shift } = models();
  return Shift.create({ eventId, ...data, startsAtUtc: data.startsAtUtc || data.startsAt, endsAtUtc: data.endsAtUtc || data.endsAt });
}

async function list(eventId, user, membership) {
  await findEvent(eventId);
  const { Shift } = models();
  const where = { eventId, status: 'active' };
  if (membership && membership.role === 'shift_lead') {
    where.leadUserId = user.id;
  }
  return Shift.findAll({ where, order: [['startsAt', 'ASC']] });
}

async function get(eventId, shiftId, user, membership) {
  const shift = await findShift(eventId, shiftId);
  if (membership && membership.role === 'shift_lead' && shift.leadUserId !== user.id) {
    throw new AppError('Shift not found', 404, 'SHIFT_NOT_FOUND');
  }
  return shift;
}

async function update(eventId, shiftId, data, membership) {
  const shift = await findShift(eventId, shiftId);
  const event = await findEvent(eventId);
  const startsAt = data.startsAt || shift.startsAt;
  const endsAt = data.endsAt || shift.endsAt;
  validateTimeRange(startsAt, endsAt);
  eventBoundsError(startsAt, endsAt, event);
  await validateLead(event, data.leadUserId === undefined ? shift.leadUserId : data.leadUserId);
  const count = await activeSignupCount(shift.id);
  const changed = data.startsAt !== undefined || data.endsAt !== undefined ||
    data.capacity !== undefined || data.leadUserId !== undefined;
  if (data.capacity !== undefined && data.capacity < count) {
    throw new AppError(
      'Capacity cannot be lower than active signup count',
      409,
      'SHIFT_CAPACITY_BELOW_SIGNUPS'
    );
  }
  if (changed) requireConfirmation(data.confirmChange, count);
  const { confirmChange, ...updates } = data;
  await shift.update(updates);
  return shift;
}

async function cancel(eventId, shiftId, data = {}) {
  const shift = await findShift(eventId, shiftId);
  const count = await activeSignupCount(shift.id);
  requireConfirmation(data.confirmChange, count);
  await shift.update({ status: 'cancelled' });
  return shift;
}

module.exports = { create, list, get, update, cancel, remove: cancel };