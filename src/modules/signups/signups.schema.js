const Joi = require('joi');

const params = Joi.object({
  shiftId: Joi.string().guid({ version: 'uuidv4' }).required()
});

module.exports = { params };