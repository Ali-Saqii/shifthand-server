const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const DeviceToken = sequelize.define('DeviceToken', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
  token: { type: DataTypes.STRING(512), allowNull: false, unique: true },
  platform: { type: DataTypes.ENUM('ios', 'android'), allowNull: false }
}, {
  tableName: 'device_tokens'
});

module.exports = DeviceToken;