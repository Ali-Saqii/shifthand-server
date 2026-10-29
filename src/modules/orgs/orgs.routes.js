const express = require('express');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const loadMembership = require('../../middleware/loadMembership');
const requireRole = require('../../middleware/requireRole');
const controller = require('./orgs.controller');
const schema = require('./orgs.schema');
const { policies } = require('../../lib/organizationPolicies');

const router = express.Router();

router.use(authenticate);
router.post('/', validate(schema.createOrganization), controller.create);
router.get('/', controller.list);
router.post(
  '/:organizationId/invites',
  validate(schema.organizationId, 'params'),
  loadMembership,
  requireRole(...policies.manageMembers),
  validate(schema.invite),
  controller.createInvite
);
router.post(
  '/:organizationId/invites/accept',
  validate(schema.organizationId, 'params'),
  validate(schema.acceptInvite),
  controller.acceptInvite
);
router.get(
  '/:organizationId/members',
  validate(schema.organizationId, 'params'),
  loadMembership,
  requireRole(...policies.manageMembers),
  controller.listMembers
);
router.post(
  '/:organizationId/members',
  validate(schema.organizationId, 'params'),
  loadMembership,
  requireRole(...policies.manageMembers),
  validate(schema.addMember),
  controller.addMember
);
router.delete(
  '/:organizationId/members/:userId',
  validate(schema.memberId, 'params'),
  loadMembership,
  requireRole(...policies.manageMembers),
  controller.removeMember
);
router.patch(
  '/:organizationId/members/:userId',
  validate(schema.memberId, 'params'),
  loadMembership,
  requireRole(...policies.manageMembers),
  validate(schema.updateMember),
  controller.updateMember
);

module.exports = router;