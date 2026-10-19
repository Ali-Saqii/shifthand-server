const Joi = require('joi');

const createOrganization = Joi.object({
  name: Joi.string().trim().min(1).max(160).required()
});

const addMember = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  role: Joi.string().valid('admin', 'member').default('member')
});

const organizationId = Joi.object({
  organizationId: Joi.string().guid({ version: 'uuidv4' }).required()
});

const memberId = organizationId.keys({
  userId: Joi.string().guid({ version: 'uuidv4' }).required()
});

module.exports = { createOrganization, addMember, organizationId, memberId };