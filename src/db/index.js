const { Sequelize } = require('sequelize');
const config = require('../config');

const sequelize = config.database.url
  ? new Sequelize(config.database.url, {
    dialect: 'mysql',
    logging: false
  })
  : new Sequelize(config.database.name, config.database.user, config.database.password, {
    host: config.database.host,
    port: config.database.port,
    dialect: 'mysql',
    logging: false
  });

Object.assign(sequelize.options, {
  dialect: 'mysql',
  logging: false,
  define: {
    underscored: true,
    timestamps: true
  }
});

module.exports = sequelize;