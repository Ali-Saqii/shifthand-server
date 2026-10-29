const Joi = require('joi');

const register = Joi.object({
  token: Joi.string().trim().min(1).max(512).required(),
  platform: Joi.string().valid('ios', 'android').required()
});

const remove = Joi.object({
  token: Joi.string().trim().min(1).max(512).required()
});

module.exports = { register, remove };