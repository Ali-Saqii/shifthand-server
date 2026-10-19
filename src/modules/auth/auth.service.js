const bcrypt = require('bcrypt');
const AppError = require('../../lib/AppError');
const {
  createAccessToken,
  createRefreshToken,
  hashToken,
  verifyRefreshToken
} = require('../../lib/tokens');

function getModels() {
  return require('../../db/models');
}

function tokenResponse(user, refreshToken) {
  return {
    user: { id: user.id, name: user.name, email: user.email },
    accessToken: createAccessToken(user),
    refreshToken
  };
}

async function register({ name, email, password }) {
  const { User, RefreshToken } = getModels();
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new AppError('Email is already registered', 409, 'EMAIL_ALREADY_REGISTERED');
  }

  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12)
  });
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
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  const stored = await RefreshToken.findOne({
    where: { userId: payload.sub, tokenHash: hashToken(refreshToken), revokedAt: null }
  });
  if (!stored || stored.expiresAt <= new Date()) {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  const user = await User.findByPk(payload.sub);
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

module.exports = { register, login, refresh };