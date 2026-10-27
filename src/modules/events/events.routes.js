const express = require('express');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const loadMembership = require('../../middleware/loadMembership');
const requireRole = require('../../middleware/requireRole');
const controller = require('./events.controller');
const schema = require('./events.schema');
const { policies } = require('../../lib/organizationPolicies');

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.get(
  '/',
  validate(schema.organizationParams, 'params'),
  loadMembership,
  validate(schema.listQuery, 'query'),
  controller.list
);
router.post(
  '/',
  validate(schema.organizationParams, 'params'),
  loadMembership,
  requireRole(...policies.manageEvents),
  validate(schema.createEvent),
  controller.create
);
router.get(
  '/:eventId',
  validate(schema.eventParams, 'params'),
  loadMembership,
  controller.get
);
router.post(
  '/:eventId/publish',
  validate(schema.eventParams, 'params'),
  loadMembership,
  requireRole(...policies.manageEvents),
  controller.publish
);
router.post(
  '/:eventId/cancel',
  validate(schema.eventParams, 'params'),
  loadMembership,
  requireRole(...policies.manageEvents),
  controller.cancel
);
router.patch(
  '/:eventId',
  validate(schema.eventParams, 'params'),
  loadMembership,
  requireRole(...policies.manageEvents),
  validate(schema.updateEvent),
  controller.update
);
router.delete(
  '/:eventId',
  validate(schema.eventParams, 'params'),
  loadMembership,
  requireRole(...policies.manageEvents),
  controller.remove
);

module.exports = router;