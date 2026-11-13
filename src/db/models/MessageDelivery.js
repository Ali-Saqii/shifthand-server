const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const MessageDelivery = sequelize.define('MessageDelivery', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  organizationId: { type: DataTypes.UUID, allowNull: false, field: 'organization_id' },
  recipient: { type: DataTypes.STRING(255), allowNull: false },
  channel: { type: DataTypes.STRING(32), allowNull: false },
  template: { type: DataTypes.STRING(120), allowNull: false },
  payload: { type: DataTypes.JSON, allowNull: false },
  status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending' },
  attempts: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  availableAt: { type: DataTypes.DATE, allowNull: false, field: 'available_at' },
  sentAt: { type: DataTypes.DATE, allowNull: true, field: 'sent_at' },
  lastError: { type: DataTypes.TEXT, allowNull: true, field: 'last_error' },
  idempotencyKey: { type: DataTypes.STRING(255), allowNull: true, field: 'idempotency_key' }
}, {
  tableName: 'message_deliveries',
  indexes: [{ unique: true, fields: ['idempotency_key'] }]
});

module.exports = MessageDelivery;
