const express = require('express');
const validate = require('../../middleware/validate');
const controller = require('./volunteers.controller');
const schema = require('./volunteers.schema');
const signupSchema = require('./signup.schema');
const signupService = require('./signup.service');
const rateLimit = require('../../middleware/rateLimit');
const AppError = require('../../lib/AppError');

const router = express.Router();
const signupRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

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
router.post(
  '/resend',
  validate(schema.resend),
  controller.resendAccess
);
router.post(
  '/shifts/:shiftId/signup',
  signupRateLimit,
  validate(signupSchema.params, 'params'),
  validate(signupSchema.signup),
  async (req, res, next) => {
    try {
      const idempotencyKey = req.get('Idempotency-Key');
      if (!idempotencyKey) {
        throw new AppError('Idempotency-Key header is required', 400, 'IDEMPOTENCY_KEY_REQUIRED');
      }
      const result = await signupService.create(
        req.params.shiftId,
        req.body.accessToken,
        idempotencyKey
      );
      res.status(result.reused ? 200 : 201).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
