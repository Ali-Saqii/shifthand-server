const Joi = require('joi');

const params = Joi.object({
  shiftId: Joi.string().guid({ version: 'uuidv4' }).required()
});

const signup = Joi.object({
  accessToken: Joi.string().hex().length(64).required()
});

module.exports = { params, signup };
