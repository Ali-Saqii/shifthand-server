const Joi = require('joi');

const createOrganization = Joi.object({
  name: Joi.string().trim().min(1).max(160).required(),
  timezone: Joi.string().trim().custom((value, helpers) => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
      return value;
    } catch (error) {
      return helpers.error('any.invalid');
    }
  }).default('UTC')
});

const addMember = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  role: Joi.string().valid('coordinator', 'shift_lead').default('shift_lead')
});

const organizationId = Joi.object({
  organizationId: Joi.string().guid({ version: 'uuidv4' }).required()
});

const memberId = organizationId.keys({
  userId: Joi.string().guid({ version: 'uuidv4' }).required()
});

const invite = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  role: Joi.string().valid('coordinator', 'shift_lead').required()
});

const acceptInvite = Joi.object({
  code: Joi.string().trim().length(8).pattern(/^[A-Z0-9]+$/).required()
});

const updateMember = Joi.object({
  role: Joi.string().valid('owner', 'coordinator', 'shift_lead').required()
});

module.exports = {
  createOrganization, addMember, organizationId, memberId, invite, acceptInvite, updateMember
};