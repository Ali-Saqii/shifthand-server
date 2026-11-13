const cron = require('node-cron');
const { sendUpcomingShiftReminders } = require('./reminders');
const { processOutbox } = require('./outbox');
const logger = require('../lib/logger');

function startJobs() {
  return cron.schedule('*/5 * * * *', async () => {
    try {
      await sendUpcomingShiftReminders();
    } catch (error) {
      logger.error({ err: error }, 'Reminder job failed');
    }
    try {
      await processOutbox();
    } catch (error) {
      logger.error({ err: error }, 'Message outbox job failed');
    }
  });
}

module.exports = { startJobs };