const AppError = require('../lib/AppError');
const { hasRole } = require('../lib/organizationPolicies');

module.exports = function requireRole(...roles) {
  return (req, res, next) => {
    if (!hasRole(req.membership, roles)) {
      next(new AppError('Insufficient organization permissions', 403, 'INSUFFICIENT_ORGANIZATION_PERMISSIONS'));
      return;
    }
    next();
  };
};