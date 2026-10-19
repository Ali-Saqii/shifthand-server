const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Signup = sequelize.define('Signup', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  shiftId: { type: DataTypes.UUID, allowNull: false, field: 'shift_id' },
  userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' }
}, {
  tableName: 'signups',
  indexes: [{ unique: true, fields: ['shift_id', 'user_id'] }]
});

module.exports = Signup;