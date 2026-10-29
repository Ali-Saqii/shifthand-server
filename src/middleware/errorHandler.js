module.exports = function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const isJsonSyntaxError = error instanceof SyntaxError && error.status === 400 && error.type === 'entity.parse.failed';
  const statusCode = isJsonSyntaxError ? 400 : (error.statusCode || 500);
  const responseError = {
    code: isJsonSyntaxError ? 'INVALID_JSON' : (error.code || 'INTERNAL_ERROR'),
    message: statusCode >= 500
      ? 'Internal server error'
      : (isJsonSyntaxError ? 'Request body contains invalid JSON' : error.message)
  };
  const details = isJsonSyntaxError ? undefined : error.details;
  if (details !== undefined) {
    responseError.details = details;
  }

  res.status(statusCode).json({ error: responseError });
};