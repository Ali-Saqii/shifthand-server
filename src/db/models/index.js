'use strict';

const sequelize = require('../index');
const User = require('./User');
const Organization = require('./Organization');
const Membership = require('./Membership');
const Event = require('./Event');
const Shift = require('./Shift');
const Signup = require('./Signup');
const DeviceToken = require('./DeviceToken');
const RefreshToken = require('./RefreshToken');
const StaffInvite = require('./StaffInvite');

User.belongsToMany(Organization, { through: Membership, foreignKey: 'userId', otherKey: 'organizationId' });
Organization.belongsToMany(User, { through: Membership, foreignKey: 'organizationId', otherKey: 'userId' });
User.hasMany(Membership, { foreignKey: 'userId' });
Organization.hasMany(Membership, { foreignKey: 'organizationId' });
Membership.belongsTo(User, { foreignKey: 'userId' });
Membership.belongsTo(Organization, { foreignKey: 'organizationId' });
Organization.hasMany(Event, { foreignKey: 'organizationId' });
Event.belongsTo(Organization, { foreignKey: 'organizationId' });
Event.hasMany(Shift, { foreignKey: 'eventId' });
Shift.belongsTo(Event, { foreignKey: 'eventId' });
Shift.hasMany(Signup, { foreignKey: 'shiftId' });
Signup.belongsTo(Shift, { foreignKey: 'shiftId' });
User.hasMany(Signup, { foreignKey: 'userId' });
Signup.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(DeviceToken, { foreignKey: 'userId' });
DeviceToken.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(RefreshToken, { foreignKey: 'userId' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });
Organization.hasMany(StaffInvite, { foreignKey: 'organizationId' });
StaffInvite.belongsTo(Organization, { foreignKey: 'organizationId' });

module.exports = {
  sequelize,
  User,
  Organization,
  Membership,
  Event,
  Shift,
  Signup,
  DeviceToken,
  RefreshToken,
  StaffInvite
};