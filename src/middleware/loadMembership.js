const AppError = require('../lib/AppError');

module.exports = async function loadMembership(req, res, next) {
  try {
    const { Membership } = require('../db/models');
    const headerOrganizationId = req.get('x-org-id');
    const organizationId = headerOrganizationId || req.params.organizationId;
    if (headerOrganizationId && req.params.organizationId &&
        headerOrganizationId !== req.params.organizationId) {
      next(new AppError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND'));
      return;
    }
    const membership = await Membership.findOne({
      where: {
        organizationId,
        userId: req.user.id
      }
    });

    if (!membership) {
      next(new AppError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND'));
      return;
    }

    req.membership = membership;
    req.organizationId = organizationId;
    next();
  } catch (error) {
    next(error);
  }
};