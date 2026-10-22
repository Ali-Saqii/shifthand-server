const app = require('./app');
const config = require('./config');
const sequelize = require('./db');

async function start() {
  try {
    await sequelize.authenticate();
    app.listen(config.port, () => {
      console.log(`ShiftHand API listening on port ${config.port}`);
    });
  } catch (error) {
    console.error(`Unable to start ShiftHand API: ${error.message}`);
    process.exitCode = 1;
  }
}

start();