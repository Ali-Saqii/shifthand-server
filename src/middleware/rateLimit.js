const AppError = require('../lib/AppError');

function rateLimit({ windowMs = 60 * 1000, max = 60 } = {}) {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const current = requests.get(key);

    if (!current || current.expiresAt <= now) {
      requests.set(key, { count: 1, expiresAt: now + windowMs });
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