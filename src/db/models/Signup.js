const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Signup = sequelize.define('Signup', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  shiftId: { type: DataTypes.UUID, allowNull: false, field: 'shift_id' },
  userId: { type: DataTypes.UUID, allowNull: true, field: 'user_id' },
  volunteerId: { type: DataTypes.UUID, allowNull: true, field: 'volunteer_id' },
  status: {
    type: DataTypes.ENUM(
      'unverified', 'pending', 'confirmed', 'waitlisted', 'offered',
      'cancelled', 'declined', 'expired', 'completed', 'no_show'
    ),
    allowNull: false,
    defaultValue: 'confirmed'
  },
  holdExpiresAt: { type: DataTypes.DATE, allowNull: true, field: 'hold_expires_at' },
  queuePosition: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'queue_position' },
  offerExpiresAt: { type: DataTypes.DATE, allowNull: true, field: 'offer_expires_at' },
  cancelledBy: { type: DataTypes.UUID, allowNull: true, field: 'cancelled_by' },
  lateCancel: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'late_cancel' }
}, {
  tableName: 'signups',
  indexes: [{ unique: true, fields: ['shift_id', 'user_id'] }]
});

module.exports = Signup;