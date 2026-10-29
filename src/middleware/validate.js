module.exports = function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { value, error } = schema.validate(req[source], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: false
    });
    if (error) {
      const fields = {};
      for (const detail of error.details) {
        const field = detail.path.join('.') || 'request';
        fields[field] = detail.message;
      }
      const AppError = require('../lib/AppError');
      next(new AppError(
        'Request validation failed',
        422,
        'VALIDATION_ERROR',
        { fields }
      ));
      return;
    }
    req[source] = value;
    next();
  };
};