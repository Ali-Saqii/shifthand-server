const AppError = require('../lib/AppError');

module.exports = async function loadEventMembership(req, res, next) {
  try {
    const { Event, Membership } = require('../db/models');
    const event = await Event.findByPk(req.params.eventId);
    if (!event) {
      next(new AppError('Event not found', 404, 'EVENT_NOT_FOUND'));
      return;
    }

    const membership = await Membership.findOne({
      where: {
        organizationId: event.organizationId,
        userId: req.user.id
      }
    });
    if (!membership) {
      next(new AppError('Organization membership required', 403, 'ORGANIZATION_MEMBERSHIP_REQUIRED'));
      return;
    }

    req.event = event;
    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
};
