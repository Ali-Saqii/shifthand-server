const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const RefreshToken = sequelize.define('RefreshToken', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
  tokenHash: { type: DataTypes.STRING(255), allowNull: false, unique: true, field: 'token_hash' },
  expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
  revokedAt: { type: DataTypes.DATE, field: 'revoked_at' }
}, {
  tableName: 'refresh_tokens'
});

module.exports = RefreshToken;