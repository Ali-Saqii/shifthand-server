const Joi = require('joi');

const shiftFields = {
  title: Joi.string().trim().min(1).max(200),
  startsAt: Joi.date().iso(),
  endsAt: Joi.date().iso(),
  capacity: Joi.number().integer().min(1).max(100000),
  roleLabel: Joi.string().trim().max(120).allow('', null),
  startsAtUtc: Joi.date().iso(),
  endsAtUtc: Joi.date().iso(),
  cancelCutoffHours: Joi.number().integer().min(0).max(8760),
  leadUserId: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  notes: Joi.string().allow('', null)
};

const createShift = Joi.object({
  ...shiftFields,
  title: shiftFields.title.required(),
  startsAt: shiftFields.startsAt.required(),
  endsAt: shiftFields.endsAt.required(),
  capacity: shiftFields.capacity.required()
});

const updateShift = Joi.object({
  ...shiftFields,
  confirmChange: Joi.boolean().default(false)
}).min(1);

const params = Joi.object({
  eventId: Joi.string().guid({ version: 'uuidv4' }).required(),
  shiftId: Joi.string().guid({ version: 'uuidv4' }).required()
});

const eventParams = Joi.object({
  eventId: Joi.string().guid({ version: 'uuidv4' }).required()
});

const cancelShift = Joi.object({
  confirmChange: Joi.boolean().default(false)
});

module.exports = { createShift, updateShift, cancelShift, params, eventParams };