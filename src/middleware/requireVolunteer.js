const AppError = require('../lib/AppError');

module.exports = function requireVolunteer(req, res, next) {
  const volunteerId = req.signedCookies?.volunteerId;
  if (!volunteerId) {
    next(new AppError('Volunteer sign-in required', 401, 'VOLUNTEER_AUTH_REQUIRED'));
    return;
  }
  req.volunteerId = volunteerId;
  next();
};
