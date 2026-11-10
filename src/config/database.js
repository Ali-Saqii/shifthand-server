const config = require('./index');

function connectionConfig() {
  if (config.database.url) {
    return {
      use_env_variable: 'DATABASE_URL',
      dialect: 'mysql'
    };
  }

  return {
    username: config.database.user,
    password: config.database.password,
    database: config.database.name,
    host: config.database.host,
    port: config.database.port,
    dialect: 'mysql'
  };
}

module.exports = {
  development: connectionConfig(),
  test: connectionConfig(),
  production: connectionConfig()
};
