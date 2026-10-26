const AppError = require('../lib/AppError');

module.exports = async function loadShiftMembership(req, res, next) {
  try {
    const { Shift, Event, Membership } = require('../db/models');
    const shift = await Shift.findByPk(req.params.shiftId);
    if (!shift) {
      next(new AppError('Shift not found', 404, 'SHIFT_NOT_FOUND'));
      return;
    }

    const event = await Event.findByPk(shift.eventId);
    if (!event) {
      next(new AppError('Event not found', 404, 'EVENT_NOT_FOUND'));
      return;
    }
    const organizationId = req.get('x-org-id') || event.organizationId;
    if (req.get('x-org-id') && req.get('x-org-id') !== event.organizationId) {
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

    req.shift = shift;
    req.event = event;
    req.membership = membership;
    req.organizationId = organizationId;
    next();
  } catch (error) {
    next(error);
  }
};
