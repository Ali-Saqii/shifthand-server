const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Volunteer = sequelize.define('Volunteer', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  organizationId: { type: DataTypes.UUID, allowNull: false, field: 'organization_id' },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(32), allowNull: true },
  contactVerifiedAt: { type: DataTypes.DATE, allowNull: true, field: 'contact_verified_at' },
  consentAt: { type: DataTypes.DATE, allowNull: true, field: 'consent_at' },
  blocked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, {
  tableName: 'volunteers',
  indexes: [{ unique: true, fields: ['organization_id', 'email'] }]
});

module.exports = Volunteer;
