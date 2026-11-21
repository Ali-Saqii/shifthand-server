const express = require('express');
const Joi = require('joi');
const validate = require('../../middleware/validate');
const requireVolunteer = require('../../middleware/requireVolunteer');
const volunteerService = require('./volunteer.service');
const config = require('../../config');
const crypto = require('crypto');
const requireCsrf = require('../../middleware/requireCsrf');

const router = express.Router();
const signupParams = Joi.object({
  signupId: Joi.string().guid({ version: 'uuidv4' }).required()
});
const magicParams = Joi.object({
  token: Joi.string().hex().length(64).required()
});

router.get('/:token', validate(magicParams, 'params'), async (req, res, next) => {
  try {
    const volunteer = await volunteerService.activateMagicLink(req.params.token);
    res.cookie('volunteerId', volunteer.id, {
      signed: true,
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('volunteerCsrf', csrfToken, {
      httpOnly: false,
      secure: config.env === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    res.redirect(303, '/v');
  } catch (error) {
    next(error);
  }
});

router.use(requireVolunteer);
router.get('/', async (req, res, next) => {
  try {
    res.json({ data: await volunteerService.listMyShifts(req.volunteerId) });
  } catch (error) {
    next(error);
  }
});
router.post('/signups/:signupId/cancel', requireCsrf, validate(signupParams, 'params'), async (req, res, next) => {
  try {
    res.json({ data: await volunteerService.cancelSignup(req.volunteerId, req.params.signupId) });
  } catch (error) {
    next(error);
  }
});
router.get('/signups/:signupId/calendar', validate(signupParams, 'params'), async (req, res, next) => {
  try {
    const calendar = await volunteerService.calendarSignup(req.volunteerId, req.params.signupId);
    res.set('Content-Type', 'text/calendar; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="shift-${req.params.signupId}.ics"`);
    res.send(calendar);
  } catch (error) {
    next(error);
  }
});
router.post('/signout', (req, res) => {
  res.clearCookie('volunteerId');
  res.clearCookie('volunteerCsrf');
  res.status(204).send();
});

module.exports = router;
