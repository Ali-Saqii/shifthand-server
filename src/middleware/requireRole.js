const AppError = require('../lib/AppError');

module.exports = function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.membership || !roles.includes(req.membership.role)) {
      next(new AppError('Insufficient organization permissions', 403, 'INSUFFICIENT_ORGANIZATION_PERMISSIONS'));
      return;
    }
    next();
  };
};