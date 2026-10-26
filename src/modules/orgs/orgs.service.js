const AppError = require('../../lib/AppError');
const crypto = require('crypto');

function models() {
  return require('../../db/models');
}

async function create(userId, name) {
  return createWithDetails(userId, { name, timezone: 'UTC' });
}

async function createWithDetails(userId, { name, timezone }) {
  const { Organization, Membership } = models();
  const { sequelize } = require('../../db');
  return sequelize.transaction(async (transaction) => {
    const organization = await Organization.create({ name, timezone }, { transaction });
    await Membership.create({
      organizationId: organization.id,
      userId,
      role: 'owner'
    }, { transaction });
    return organization;
  });
}

async function list(userId) {
  const { Organization, Membership } = models();
  const memberships = await Membership.findAll({
    where: { userId },
    attributes: ['organizationId', 'role'],
    include: [{
      model: Organization,
      attributes: ['id', 'name', 'timezone', 'settings', 'createdAt', 'updatedAt']
    }]
  });

  return memberships.map((membership) => ({
    ...membership.Organization.toJSON(),
    role: membership.role
  }));
}

async function listMembers(organizationId) {
  const { Membership, User } = models();
  const memberships = await Membership.findAll({
    where: { organizationId },
    attributes: ['userId', 'role', 'createdAt'],
    include: [{ model: User, attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'ASC']]
  });

  return memberships.map((membership) => ({
    user: membership.User,
    role: membership.role,
    joinedAt: membership.createdAt
  }));
}

async function addMember(organizationId, email, role) {
  const { Membership, User } = models();
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const existing = await Membership.findOne({ where: { organizationId, userId: user.id } });
  if (existing) {
    throw new AppError('User is already a member', 409, 'MEMBERSHIP_ALREADY_EXISTS');
  }

  const membership = await Membership.create({ organizationId, userId: user.id, role });
  return { user: { id: user.id, name: user.name, email: user.email }, role: membership.role };
}

async function createInvite(organizationId, email, role) {
  const { StaffInvite } = models();
  const code = crypto.randomBytes(4).toString('hex').toUpperCase();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await StaffInvite.create({
    organizationId,
    email,
    role,
    codeHash: hashInviteCode(code),
    expiresAt
  });
  return { email, role, code, expiresAt };
}

function hashInviteCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function acceptInvite(userId, organizationId, code) {
  const { StaffInvite, Membership, User } = models();
  const { sequelize } = require('../../db');
  return sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(userId, { attributes: ['email'], transaction });
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    const invite = await StaffInvite.findOne({
      where: {
        organizationId,
        email: user.email,
        codeHash: hashInviteCode(code),
        usedAt: null
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!invite || invite.expiresAt <= new Date()) {
      throw new AppError('Invite is invalid or expired', 400, 'INVITE_INVALID');
    }

    const existing = await Membership.findOne({
      where: { organizationId, userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (existing) {
      throw new AppError('User is already a member', 409, 'MEMBERSHIP_ALREADY_EXISTS');
    }

    const membership = await Membership.create({
      organizationId,
      userId,
      role: invite.role
    }, { transaction });
    await invite.update({ usedAt: new Date() }, { transaction });
    return { organizationId, role: membership.role };
  });
}

async function removeMember(organizationId, userId) {
  const { Membership } = models();
  const { sequelize } = require('../../db');
  await sequelize.transaction(async (transaction) => {
    const membership = await Membership.findOne({
      where: { organizationId, userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!membership) {
      throw new AppError('Membership not found', 404, 'MEMBERSHIP_NOT_FOUND');
    }
    if (membership.role === 'owner') {
      throw new AppError('Organization owner cannot be removed', 400, 'OWNER_CANNOT_BE_REMOVED');
    }
    await membership.destroy({ transaction });
  });
}

async function updateMember(organizationId, userId, role) {
  const { Membership } = models();
  const { sequelize } = require('../../db');
  return sequelize.transaction(async (transaction) => {
    const membership = await Membership.findOne({
      where: { organizationId, userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!membership) {
      throw new AppError('Membership not found', 404, 'MEMBERSHIP_NOT_FOUND');
    }
    if (membership.role === 'owner' && role !== 'owner') {
      const ownerCount = await Membership.count({
        where: { organizationId, role: 'owner' },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (ownerCount <= 1) {
        throw new AppError('Organization must retain an owner', 400, 'LAST_OWNER_REQUIRED');
      }
    }
    if (role === 'owner' && membership.role !== 'owner') {
      await Membership.update(
        { role: 'coordinator' },
        { where: { organizationId, role: 'owner' }, transaction }
      );
    }
    await membership.update({ role }, { transaction });
    return { userId, role: membership.role };
  });
}

module.exports = {
  create,
  createWithDetails,
  list,
  listMembers,
  addMember,
  createInvite,
  acceptInvite,
  removeMember,
  updateMember
};