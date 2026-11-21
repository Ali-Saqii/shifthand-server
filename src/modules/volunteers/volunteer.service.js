const crypto = require('crypto');
const { Op } = require('sequelize');
const AppError = require('../../lib/AppError');

function models() {
  return require('../../db/models');
}

async function activateMagicLink(rawToken) {
  const { VolunteerAccessToken, Volunteer } = models();
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const token = await VolunteerAccessToken.findOne({
    where: { tokenHash, revokedAt: null, expiresAt: { [Op.gt]: new Date() } },
    include: [{ model: Volunteer }]
  });
  if (!token || !token.Volunteer) {
    throw new AppError('Invalid or expired volunteer access token', 401, 'INVALID_VOLUNTEER_TOKEN');
  }
  await token.Volunteer.update({ contactVerifiedAt: new Date() });
  await token.update({ lastUsedAt: new Date(), revokedAt: new Date() });
  const { Signup } = models();
  await Signup.update(
    { status: 'pending', holdExpiresAt: null },
    { where: { volunteerId: token.Volunteer.id, status: 'unverified' } }
  );
  return token.Volunteer;
}

async function listMyShifts(volunteerId) {
  const { Signup, Shift, Event } = models();
  const now = new Date();
  const signups = await Signup.findAll({
    where: { volunteerId },
    include: [{ model: Shift, include: [{ model: Event }] }],
    order: [['createdAt', 'DESC']]
  });
  const upcoming = [];
  const past = [];
  const cancelled = [];
  for (const signup of signups) {
    if (signup.status === 'cancelled' || signup.Shift?.status === 'cancelled') {
      cancelled.push(signup);
    } else if (new Date(signup.Shift?.startsAt) >= now) {
      upcoming.push(signup);
    } else {
      past.push(signup);
    }
  }
  return { upcoming, past, cancelled };
}

async function cancelSignup(volunteerId, signupId) {
  const { sequelize, Signup, Shift, Event, Volunteer, MessageDelivery } = models();
  return sequelize.transaction(async (transaction) => {
    const signup = await Signup.findOne({
      where: { id: signupId, volunteerId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!signup) throw new AppError('Signup not found', 404, 'SIGNUP_NOT_FOUND');
    if (signup.status === 'cancelled') return { cancelled: true, reused: true };
    const shift = await Shift.findByPk(signup.shiftId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!shift) throw new AppError('Shift not found', 404, 'SHIFT_NOT_FOUND');
    const cutoff = new Date(shift.startsAt).getTime() - (shift.cancelCutoffHours || 0) * 3600000;
    const lateCancel = Date.now() > cutoff;
    await signup.update({
      status: 'cancelled',
      cancelledBy: volunteerId,
      lateCancel
    }, { transaction });
    const volunteer = await Volunteer.findByPk(volunteerId, { transaction });
    const event = await Event.findByPk(shift.eventId, { transaction, attributes: ['organizationId'] });
    if (volunteer && event && MessageDelivery) {
      await MessageDelivery.create({
        organizationId: event.organizationId,
        recipient: volunteer.email,
        channel: 'email',
        template: 'signup-cancellation',
        payload: {
          name: volunteer.name,
          shiftTitle: shift.title,
          lateCancel
        },
        availableAt: new Date(),
        idempotencyKey: `signup-cancellation:${signup.id}`
      }, { transaction });
    }
    return { cancelled: true, reused: false };
  });
}

async function calendarSignup(volunteerId, signupId) {
  const { Signup, Shift, Event, Organization } = models();
  const signup = await Signup.findOne({
    where: { id: signupId, volunteerId },
    include: [{
      model: Shift,
      include: [{ model: Event, include: [{ model: Organization }] }]
    }]
  });
  if (!signup) throw new AppError('Signup not found', 404, 'SIGNUP_NOT_FOUND');
  const shift = signup.Shift;
  const event = shift?.Event;
  if (!shift || !event) throw new AppError('Shift not found', 404, 'SHIFT_NOT_FOUND');
  const icsDate = (value) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const escapeIcs = (value) => String(value || '').replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ShiftHand//Volunteer Calendar//EN',
    'BEGIN:VEVENT',
    `UID:${signup.id}@shift-hand`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(shift.startsAt)}`,
    `DTEND:${icsDate(shift.endsAt)}`,
    `SUMMARY:${escapeIcs(`${event.title} - ${shift.title}`)}`,
    `LOCATION:${escapeIcs(event.location || event.venue || '')}`,
    `DESCRIPTION:${escapeIcs(shift.notes || event.description || '')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  return content;
}

module.exports = { activateMagicLink, listMyShifts, cancelSignup, calendarSignup };
