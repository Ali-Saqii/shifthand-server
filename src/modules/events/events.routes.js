const express = require('express');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const loadMembership = require('../../middleware/loadMembership');
const requireRole = require('../../middleware/requireRole');
const controller = require('./events.controller');
const schema = require('./events.schema');

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.get(
  '/',
  validate(schema.organizationParams, 'params'),
  loadMembership,
  controller.list
);
router.post(
  '/',
  validate(schema.organizationParams, 'params'),
  loadMembership,
  requireRole('owner', 'coordinator'),
  validate(schema.createEvent),
  controller.create
);
router.get(
  '/:eventId',
  validate(schema.eventParams, 'params'),
  loadMembership,
  controller.get
);
router.patch(
  '/:eventId',
  validate(schema.eventParams, 'params'),
  loadMembership,
  requireRole('owner', 'coordinator'),
  validate(schema.updateEvent),
  controller.update
);
router.delete(
  '/:eventId',
  validate(schema.eventParams, 'params'),
  loadMembership,
  requireRole('owner', 'coordinator'),
  controller.remove
);

module.exports = router;