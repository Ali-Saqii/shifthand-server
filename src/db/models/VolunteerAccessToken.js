const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const VolunteerAccessToken = sequelize.define('VolunteerAccessToken', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  volunteerId: { type: DataTypes.UUID, allowNull: false, field: 'volunteer_id' },
  tokenHash: { type: DataTypes.STRING(255), allowNull: false, field: 'token_hash' },
  expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
  revokedAt: { type: DataTypes.DATE, allowNull: true, field: 'revoked_at' },
  lastUsedAt: { type: DataTypes.DATE, allowNull: true, field: 'last_used_at' }
}, {
  tableName: 'volunteer_access_tokens',
  indexes: [{ unique: true, fields: ['token_hash'] }]
});

module.exports = VolunteerAccessToken;
