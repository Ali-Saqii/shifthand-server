const cron = require('node-cron');
const { sendUpcomingShiftReminders } = require('./reminders');
const logger = require('../lib/logger');

function startJobs() {
  return cron.schedule('*/5 * * * *', async () => {
    try {
      await sendUpcomingShiftReminders();
    } catch (error) {
      logger.error({ err: error }, 'Reminder job failed');
    }
  });
}

module.exports = { startJobs };