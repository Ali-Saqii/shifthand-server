const Joi = require('joi');

const eventFields = {
  title: Joi.string().trim().min(1).max(200),
  description: Joi.string().allow('', null),
  location: Joi.string().trim().max(255).allow('', null),
  startsAt: Joi.date().iso(),
  endsAt: Joi.date().iso()
};

const createEvent = Joi.object({
  ...eventFields,
  title: eventFields.title.required(),
  startsAt: eventFields.startsAt.required(),
  endsAt: eventFields.endsAt.required()
});

const updateEvent = Joi.object(eventFields).min(1);

const listQuery = Joi.object({
  cursor: Joi.string().trim().max(512),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

const eventParams = Joi.object({
  organizationId: Joi.string().guid({ version: 'uuidv4' }).required(),
  eventId: Joi.string().guid({ version: 'uuidv4' }).required()
});

const organizationParams = Joi.object({
  organizationId: Joi.string().guid({ version: 'uuidv4' }).required()
});

const publicEventParams = Joi.object({
  publicSlug: Joi.string().trim().min(1).max(180).required()
});

module.exports = {
  createEvent, updateEvent, listQuery, eventParams, organizationParams, publicEventParams
};