const express = require('express');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const loadMembership = require('../../middleware/loadMembership');
const requireRole = require('../../middleware/requireRole');
const controller = require('./orgs.controller');
const schema = require('./orgs.schema');

const router = express.Router();

router.use(authenticate);
router.post('/', validate(schema.createOrganization), controller.create);
router.get('/', controller.list);
router.get(
  '/:organizationId/members',
  validate(schema.organizationId, 'params'),
  loadMembership,
  controller.listMembers
);
router.post(
  '/:organizationId/members',
  validate(schema.organizationId, 'params'),
  loadMembership,
  requireRole('owner', 'admin'),
  validate(schema.addMember),
  controller.addMember
);
router.delete(
  '/:organizationId/members/:userId',
  validate(schema.memberId, 'params'),
  loadMembership,
  requireRole('owner', 'admin'),
  controller.removeMember
);

module.exports = router;