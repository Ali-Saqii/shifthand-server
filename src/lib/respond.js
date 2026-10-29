function sendData(res, data, statusCode = 200, meta) {
  const response = { data };
  if (meta !== undefined) {
    response.meta = meta;
  }
  return res.status(statusCode).json(response);
}

module.exports = { sendData };