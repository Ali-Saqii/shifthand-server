const Joi = require('joi');

const shiftFields = {
  title: Joi.string().trim().min(1).max(200),
  startsAt: Joi.date().iso(),
  endsAt: Joi.date().iso(),
  capacity: Joi.number().integer().min(1).max(100000)
};

const createShift = Joi.object({
  ...shiftFields,
  title: shiftFields.title.required(),
  startsAt: shiftFields.startsAt.required(),
  endsAt: shiftFields.endsAt.required(),
  capacity: shiftFields.capacity.required()
});

const updateShift = Joi.object(shiftFields).min(1);

const params = Joi.object({
  eventId: Joi.string().guid({ version: 'uuidv4' }).required(),
  shiftId: Joi.string().guid({ version: 'uuidv4' }).required()
});

const eventParams = Joi.object({
  eventId: Joi.string().guid({ version: 'uuidv4' }).required()
});

module.exports = { createShift, updateShift, params, eventParams };