const express = require('express');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const loadShiftMembership = require('../../middleware/loadShiftMembership');
const controller = require('./signups.controller');
const schema = require('./signups.schema');

const router = express.Router();

router.use(authenticate);
router.use('/:shiftId', validate(schema.params, 'params'), loadShiftMembership);
router.get('/:shiftId', controller.list);
router.post('/:shiftId', controller.create);
router.delete('/:shiftId', controller.remove);

module.exports = router;