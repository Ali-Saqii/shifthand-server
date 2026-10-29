const bcrypt = require('bcrypt');
const AppError = require('../../lib/AppError');
const {
  createAccessToken,
  createRefreshToken,
  hashToken
} = require('../../lib/tokens');

function getModels() {
  return require('../../db/models');
}

function tokenResponse(user, refreshToken) {
  return {
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    accessToken: createAccessToken(user),
    refreshToken
  };
}

async function register({ name, email, password, phone }) {
  const { User, RefreshToken } = getModels();
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new AppError('Email is already registered', 409, 'EMAIL_TAKEN');
  }

  let user;
  try {
    user = await User.create({
      name,
      email,
      phone,
      passwordHash: await bcrypt.hash(password, 12)
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError('Email is already registered', 409, 'EMAIL_TAKEN');
    }
    throw error;
  }
  const refreshToken = createRefreshToken(user);
  await RefreshToken.create({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });
  return tokenResponse(user, refreshToken);
}

async function login({ email, password }) {
  const { User, RefreshToken } = getModels();
  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const refreshToken = createRefreshToken(user);
  await RefreshToken.create({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });
  return tokenResponse(user, refreshToken);
}

async function refresh(refreshToken) {
  const { User, RefreshToken } = getModels();
  const stored = await RefreshToken.findOne({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null }
  });
  if (!stored || stored.expiresAt <= new Date()) {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  const user = await User.findByPk(stored.userId);
  if (!user) {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  await stored.update({ revokedAt: new Date() });
  const nextRefreshToken = createRefreshToken(user);
  await RefreshToken.create({
    userId: user.id,
    tokenHash: hashToken(nextRefreshToken),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });
  return tokenResponse(user, nextRefreshToken);
}

async function me(userId) {
  const { User, Membership, Organization } = getModels();
  const user = await User.findByPk(userId, {
    attributes: ['id', 'name', 'email', 'phone'],
    include: [{
      model: Membership,
      attributes: ['organizationId', 'role'],
      include: [{ model: Organization, attributes: ['id', 'name', 'timezone', 'settings'] }]
    }]
  });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const memberships = user.Memberships.map((membership) => ({
    organization: membership.Organization,
    role: membership.role
  }));
  return {
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    memberships
  };
}

module.exports = { register, login, refresh, me };