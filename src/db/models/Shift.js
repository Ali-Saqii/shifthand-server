const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Shift = sequelize.define('Shift', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  eventId: { type: DataTypes.UUID, allowNull: false, field: 'event_id' },
  title: { type: DataTypes.STRING(200), allowNull: false, validate: { notEmpty: true } },
  startsAt: { type: DataTypes.DATE, allowNull: false, field: 'starts_at' },
  endsAt: { type: DataTypes.DATE, allowNull: false, field: 'ends_at' },
  capacity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, validate: { min: 1 } },
  reminderSentAt: { type: DataTypes.DATE, allowNull: true, field: 'reminder_sent_at' }
}, {
  tableName: 'shifts'
});

module.exports = Shift;