const crypto = require('crypto');
const logger = require('../lib/logger');

module.exports = function requestContext(req, res, next) {
  const suppliedRequestId = req.get('x-request-id');
  const requestId = suppliedRequestId && /^[A-Za-z0-9._:-]{1,128}$/.test(suppliedRequestId)
    ? suppliedRequestId
    : crypto.randomUUID();

  req.id = requestId;
  req.log = logger.child({ requestId });
  res.set('x-request-id', requestId);
  next();
};
