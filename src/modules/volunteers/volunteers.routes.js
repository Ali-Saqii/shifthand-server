const express = require('express');
const validate = require('../../middleware/validate');
const controller = require('./volunteers.controller');
const schema = require('./volunteers.schema');

const router = express.Router();

router.post(
  '/orgs/:organizationId/access',
  validate(schema.params, 'params'),
  validate(schema.accessRequest),
  controller.requestAccess
);
router.get(
  '/access/:token',
  validate(schema.tokenParams, 'params'),
  controller.verifyAccess
);

module.exports = router;
