const AppError = require('../../lib/AppError');

function models() {
  return require('../../db/models');
}

async function create(userId, name) {
  const { Organization, Membership } = models();
  const organization = await Organization.create({ name });
  await Membership.create({
    organizationId: organization.id,
    userId,
    role: 'owner'
  });
  return organization;
}

async function list(userId) {
  const { Organization, Membership } = models();
  const memberships = await Membership.findAll({
    where: { userId },
    attributes: ['organizationId', 'role'],
    include: [{ model: Organization, attributes: ['id', 'name', 'createdAt', 'updatedAt'] }]
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

async function removeMember(organizationId, userId) {
  const { Membership } = models();
  const membership = await Membership.findOne({ where: { organizationId, userId } });
  if (!membership) {
    throw new AppError('Membership not found', 404, 'MEMBERSHIP_NOT_FOUND');
  }
  if (membership.role === 'owner') {
    throw new AppError('Organization owner cannot be removed', 400, 'OWNER_CANNOT_BE_REMOVED');
  }
  await membership.destroy();
}

module.exports = { create, list, listMembers, addMember, removeMember };