const express = require('express');
const controller = require('./auth.controller');
const schemas = require('./auth.schema');
const validate = require('../../middleware/validate');
const rateLimit = require('../../middleware/rateLimit');
const authenticate = require('../../middleware/authenticate');
const meController = require('./me.controller');

function createAuthRouter() {
  const router = express.Router();
  const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

  router.post('/register', authRateLimit, validate(schemas.register), controller.register);
  router.post('/login', authRateLimit, validate(schemas.login), controller.login);
  router.post('/refresh', authRateLimit, validate(schemas.refresh), controller.refresh);
  router.get('/me', authenticate, meController.me);

  return router;
}

module.exports = createAuthRouter;