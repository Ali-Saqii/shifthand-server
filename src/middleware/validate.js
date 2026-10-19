module.exports = function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { value, error } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
    if (error) {
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      next(error);
      return;
    }
    req[source] = value;
    next();
  };
};