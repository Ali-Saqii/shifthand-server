const express = require('express');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const controller = require('./devices.controller');
const schema = require('./devices.schema');

const router = express.Router();

router.use(authenticate);
router.post('/', validate(schema.register), controller.register);
router.delete('/', validate(schema.remove), controller.remove);

module.exports = router;