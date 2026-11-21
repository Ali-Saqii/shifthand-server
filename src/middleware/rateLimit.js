const AppError = require('../lib/AppError');

function rateLimit({ windowMs = 60 * 1000, max = 60, key = (req) => req.ip || req.socket.remoteAddress || 'unknown' } = {}) {
  const requests = new Map();

  return (req, res, next) => {
    const requestKey = key(req);
    const now = Date.now();
    const current = requests.get(requestKey);

    if (!current || current.expiresAt <= now) {
      requests.set(requestKey, { count: 1, expiresAt: now + windowMs });
      next();
      return;
    }

    current.count += 1;
    if (current.count > max) {
      res.set('Retry-After', String(Math.ceil((current.expiresAt - now) / 1000)));
      next(new AppError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED'));
      return;
    }

    next();
  };
}

module.exports = rateLimit;