const Joi = require('joi');

const register = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).max(72).required(),
  phone: Joi.string().trim().max(32).optional()
});

const login = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).max(72).required()
});

const refresh = Joi.object({
  refreshToken: Joi.string().required()
});

module.exports = { register, login, refresh };