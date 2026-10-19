const { Op } = require('sequelize');
const { sendPushNotification } = require('../lib/apns');
const logger = require('../lib/logger');

async function sendUpcomingShiftReminders(now = new Date()) {
  const { Shift, Event, Signup, DeviceToken, User } = require('../db/models');
  const windowStart = new Date(now.getTime() + (24 * 60 - 5) * 60 * 1000);
  const windowEnd = new Date(now.getTime() + (24 * 60 + 5) * 60 * 1000);
  const shifts = await Shift.findAll({
    where: {
      startsAt: { [Op.between]: [windowStart, windowEnd] },
      reminderSentAt: null
    },
    include: [{
      model: Signup,
      include: [{
        model: User,
        include: [{ model: DeviceToken, where: { platform: 'ios' }, required: false }]
      }]
    }]
  });

  for (const shift of shifts) {
    let complete = true;
    for (const signup of shift.Signups) {
      for (const device of signup.User.DeviceTokens) {
        try {
          await sendPushNotification(device.token, {
            title: 'Upcoming shift reminder',
            body: `${shift.title} starts in 24 hours`
          });
        } catch (error) {
          complete = false;
          logger.error({ err: error, shiftId: shift.id, deviceTokenId: device.id }, 'Shift reminder failed');
        }
      }
    }
    if (complete) {
      await shift.update({ reminderSentAt: now });
    }
  }
}

module.exports = { sendUpcomingShiftReminders };