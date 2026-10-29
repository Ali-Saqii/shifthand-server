const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const StaffInvite = sequelize.define('StaffInvite', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  organizationId: { type: DataTypes.UUID, allowNull: false, field: 'organization_id' },
  email: { type: DataTypes.STRING(255), allowNull: false },
  role: {
    type: DataTypes.ENUM('coordinator', 'shift_lead'),
    allowNull: false
  },
  codeHash: { type: DataTypes.STRING(255), allowNull: false, field: 'code_hash' },
  expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
  usedAt: { type: DataTypes.DATE, allowNull: true, field: 'used_at' }
}, {
  tableName: 'staff_invites'
});

module.exports = StaffInvite;
