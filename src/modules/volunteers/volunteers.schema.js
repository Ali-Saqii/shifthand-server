const Joi = require('joi');

const params = Joi.object({
  organizationId: Joi.string().guid({ version: 'uuidv4' }).required()
});

const accessRequest = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  email: Joi.string().email().lowercase().required(),
  phone: Joi.string().trim().max(32).allow('', null),
  consent: Joi.boolean().valid(true).required(),
  honeypot: Joi.string().max(0).allow('')
});

const tokenParams = Joi.object({
  token: Joi.string().hex().length(64).required()
});

module.exports = { params, accessRequest, tokenParams };
