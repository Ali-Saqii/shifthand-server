const { Op } = require('sequelize');

async function expireUnverifiedSignups(now = new Date()) {
  const { Signup } = require('../db/models');
  const result = await Signup.update(
    { status: 'expired' },
    {
      where: {
        status: 'unverified',
        holdExpiresAt: { [Op.lt]: now }
      }
    }
  );
  return { expired: result[0] || 0 };
}

module.exports = { expireUnverifiedSignups };
