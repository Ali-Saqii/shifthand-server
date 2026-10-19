const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Event = sequelize.define('Event', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  organizationId: { type: DataTypes.UUID, allowNull: false, field: 'organization_id' },
  title: { type: DataTypes.STRING(200), allowNull: false, validate: { notEmpty: true } },
  description: { type: DataTypes.TEXT },
  location: { type: DataTypes.STRING(255) },
  startsAt: { type: DataTypes.DATE, allowNull: false, field: 'starts_at' },
  endsAt: { type: DataTypes.DATE, allowNull: false, field: 'ends_at' }
}, {
  tableName: 'events'
});

module.exports = Event;