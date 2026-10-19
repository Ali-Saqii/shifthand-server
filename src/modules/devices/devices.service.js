const AppError = require('../../lib/AppError');

function getDeviceTokenModel() {
  return require('../../db/models').DeviceToken;
}

async function register(userId, token, platform) {
  const DeviceToken = getDeviceTokenModel();
  const [deviceToken] = await DeviceToken.findOrCreate({
    where: { token },
    defaults: { userId, platform }
  });

  if (deviceToken.userId !== userId || deviceToken.platform !== platform) {
    await deviceToken.update({ userId, platform });
  }
  return deviceToken;
}

async function remove(userId, token) {
  const DeviceToken = getDeviceTokenModel();
  const deleted = await DeviceToken.destroy({ where: { userId, token } });
  if (!deleted) {
    throw new AppError('Device token not found', 404, 'DEVICE_TOKEN_NOT_FOUND');
  }
}

module.exports = { register, remove };