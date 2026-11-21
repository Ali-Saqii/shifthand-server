const volunteerService = require('./volunteers.service');
const { sendData } = require('../../lib/respond');

async function requestAccess(req, res, next) {
  try {
    sendData(res, await volunteerService.requestAccess(
      req.params.organizationId,
      req.body
    ), 202);
  } catch (error) {
    next(error);
  }
}

async function verifyAccess(req, res, next) {
  try {
    sendData(res, await volunteerService.verifyAccess(req.params.token));
  } catch (error) {
    next(error);
  }
}

async function resendAccess(req, res, next) {
  try {
    sendData(res, await volunteerService.resendAccess(
      req.body.organizationId,
      req.body.email
    ), 202);
  } catch (error) {
    next(error);
  }
}

module.exports = { requestAccess, verifyAccess, resendAccess };
