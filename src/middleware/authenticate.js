const AppError = require('../lib/AppError');
const { verifyAccessToken } = require('../lib/tokens');

module.exports = function authenticate(req, res, next) {
  const header = req.get('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    next(new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
    return;
  }

  try {
    const payload = verifyAccessToken(header.slice(7));
    if (payload.type !== 'access' || !payload.sub) {
      throw new Error('Invalid access token');
    }
    req.user = { id: payload.sub };
    next();
  } catch (error) {
    next(new AppError('Invalid or expired access token', 401, 'INVALID_ACCESS_TOKEN'));
  }
};