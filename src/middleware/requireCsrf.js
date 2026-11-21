const AppError = require('../lib/AppError');

module.exports = function requireCsrf(req, res, next) {
  const cookieToken = req.cookies?.volunteerCsrf;
  const headerToken = req.get('X-CSRF-Token');
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    next(new AppError('Invalid CSRF token', 403, 'CSRF_TOKEN_INVALID'));
    return;
  }
  next();
};
