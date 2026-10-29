const express = require('express');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const loadEventMembership = require('../../middleware/loadEventMembership');
const requireRole = require('../../middleware/requireRole');
const controller = require('./shifts.controller');
const schema = require('./shifts.schema');
const { policies } = require('../../lib/organizationPolicies');

const router = express.Router();

router.use(authenticate);
router.get(
  '/:eventId',
  validate(schema.eventParams, 'params'),
  loadEventMembership,
  controller.list
);
router.post(
  '/:eventId',
  validate(schema.eventParams, 'params'),
  loadEventMembership,
  requireRole(...policies.manageShifts),
  validate(schema.createShift),
  controller.create
);
router.get(
  '/:eventId/:shiftId',
  validate(schema.params, 'params'),
  loadEventMembership,
  controller.get
);
router.patch(
  '/:eventId/:shiftId',
  validate(schema.params, 'params'),
  loadEventMembership,
  requireRole(...policies.manageShifts),
  validate(schema.updateShift),
  controller.update
);
router.delete(
  '/:eventId/:shiftId',
  validate(schema.params, 'params'),
  loadEventMembership,
  requireRole(...policies.manageShifts),
  validate(schema.cancelShift),
  controller.remove
);
router.post(
  '/:eventId/:shiftId/cancel',
  validate(schema.params, 'params'),
  loadEventMembership,
  requireRole(...policies.manageShifts),
  validate(schema.cancelShift),
  controller.cancel
);

module.exports = router;