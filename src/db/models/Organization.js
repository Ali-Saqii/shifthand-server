const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Organization = sequelize.define('Organization', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(160), allowNull: false, validate: { notEmpty: true } },
  timezone: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'UTC' },
  settings: { type: DataTypes.JSON, allowNull: true }
}, {
  tableName: 'organizations'
});

module.exports = Organization;