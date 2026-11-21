const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const IdempotencyKey = sequelize.define('IdempotencyKey', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: true, field: 'user_id' },
  organizationId: { type: DataTypes.UUID, allowNull: true, field: 'organization_id' },
  key: { type: DataTypes.STRING(255), allowNull: false },
  requestHash: { type: DataTypes.STRING(128), allowNull: false, field: 'request_hash' },
  responseStatus: { type: DataTypes.INTEGER, allowNull: true, field: 'response_status' },
  responseBody: { type: DataTypes.JSON, allowNull: true, field: 'response_body' },
  expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' }
}, {
  tableName: 'idempotency_keys',
  indexes: [{ unique: true, fields: ['user_id', 'key'] }]
});

module.exports = IdempotencyKey;
