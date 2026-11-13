const crypto = require('crypto');
const { Op } = require('sequelize');
const AppError = require('../../lib/AppError');
const config = require('../../config');

function models() {
  return require('../../db/models');
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function accessUrl(token) {
  return `${config.publicUrl}/v/access/${token}`;
}

async function requestAccess(organizationId, { name, email, phone }) {
  const {
    Volunteer, VolunteerAccessToken, MessageDelivery, Organization
  } = models();
  const organization = await Organization.findByPk(organizationId, { attributes: ['id'] });
  if (!organization) {
    throw new AppError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
  }
  const normalizedEmail = normalizeEmail(email);
  const [volunteer] = await Volunteer.findOrCreate({
    where: { organizationId, email: normalizedEmail },
    defaults: {
      name: name.trim(),
      email: normalizedEmail,
      phone: phone || null,
      consentAt: new Date()
    }
  });
  if (volunteer.blocked) {
    throw new AppError('Volunteer access is unavailable', 403, 'VOLUNTEER_BLOCKED');
  }
  await volunteer.update({
    name: name.trim(),
    phone: phone || volunteer.phone,
    consentAt: new Date()
  });

  const rawToken = crypto.randomBytes(32).toString('hex');
  await VolunteerAccessToken.update(
    { revokedAt: new Date() },
    { where: { volunteerId: volunteer.id, revokedAt: null } }
  );
  await VolunteerAccessToken.create({
    volunteerId: volunteer.id,
    tokenHash: crypto.createHash('sha256').update(rawToken).digest('hex'),
    expiresAt: new Date(Date.now() + config.volunteerTokenTtlMinutes * 60 * 1000)
  });
  await MessageDelivery.create({
    organizationId,
    recipient: normalizedEmail,
    channel: 'email',
    template: 'volunteer-access',
    payload: {
      name: volunteer.name,
      accessUrl: accessUrl(rawToken)
    },
    availableAt: new Date(),
    idempotencyKey: `volunteer-access:${volunteer.id}:${rawToken}`
  });
  return { message: 'If the email is eligible, an access link will be sent.' };
}

async function verifyAccess(rawToken) {
  const { VolunteerAccessToken, Volunteer } = models();
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const token = await VolunteerAccessToken.findOne({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { [Op.gt]: new Date() }
    },
    include: [{ model: Volunteer, attributes: ['id', 'organizationId', 'name', 'email'] }]
  });
  if (!token || !token.Volunteer) {
    throw new AppError('Invalid or expired volunteer access token', 401, 'INVALID_VOLUNTEER_TOKEN');
  }
  await token.update({ lastUsedAt: new Date() });
  return {
    volunteer: token.Volunteer,
    expiresAt: token.expiresAt
  };
}

module.exports = { requestAccess, verifyAccess };
