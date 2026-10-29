const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Membership = sequelize.define('Membership', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  organizationId: { type: DataTypes.UUID, allowNull: false, field: 'organization_id' },
  userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
  role: {
    type: DataTypes.ENUM('owner', 'coordinator', 'shift_lead'),
    allowNull: false,
    defaultValue: 'shift_lead'
  }
}, {
  tableName: 'memberships',
  indexes: [{ unique: true, fields: ['organization_id', 'user_id'] }]
});

module.exports = Membership;