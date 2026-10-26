const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Shift = sequelize.define('Shift', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  eventId: { type: DataTypes.UUID, allowNull: false, field: 'event_id' },
  title: { type: DataTypes.STRING(200), allowNull: false, validate: { notEmpty: true } },
  roleLabel: { type: DataTypes.STRING(120), allowNull: true, field: 'role_label' },
  startsAt: { type: DataTypes.DATE, allowNull: false, field: 'starts_at' },
  endsAt: { type: DataTypes.DATE, allowNull: false, field: 'ends_at' },
  startsAtUtc: { type: DataTypes.DATE, allowNull: true, field: 'starts_at_utc' },
  endsAtUtc: { type: DataTypes.DATE, allowNull: true, field: 'ends_at_utc' },
  capacity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, validate: { min: 1 } },
  reminderSentAt: { type: DataTypes.DATE, allowNull: true, field: 'reminder_sent_at' },
  cancelCutoffHours: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    field: 'cancel_cutoff_hours'
  },
  leadUserId: { type: DataTypes.UUID, allowNull: true, field: 'lead_user_id' },
  notes: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'shifts'
});

module.exports = Shift;