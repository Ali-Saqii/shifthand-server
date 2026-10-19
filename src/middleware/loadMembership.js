const AppError = require('../lib/AppError');

module.exports = async function loadMembership(req, res, next) {
  try {
    const { Membership } = require('../db/models');
    const membership = await Membership.findOne({
      where: {
        organizationId: req.params.organizationId,
        userId: req.user.id
      }
    });

    if (!membership) {
      next(new AppError('Organization membership required', 403, 'ORGANIZATION_MEMBERSHIP_REQUIRED'));
      return;
    }

    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
};