const { Op } = require('sequelize');
const { sendEmail } = require('../lib/email');
const logger = require('../lib/logger');

const MAX_ATTEMPTS = 5;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[character]));
}

function renderVolunteerAccess(payload) {
  const name = escapeHtml(payload.name || 'volunteer');
  const accessUrl = escapeHtml(payload.accessUrl);
  return {
    subject: 'Your ShiftHand volunteer access link',
    text: `Hi ${payload.name || 'volunteer'},\n\nUse this link to access your ShiftHand volunteer page:\n${payload.accessUrl}\n\nThis link expires soon.`,
    html: `<p>Hi ${name},</p><p>Use this link to access your ShiftHand volunteer page:</p><p><a href="${accessUrl}">${accessUrl}</a></p><p>This link expires soon.</p>`
  };
}

function renderMessage(message) {
  if (message.template === 'volunteer-access') {
    return renderVolunteerAccess(message.payload);
  }
  throw new Error(`Unsupported message template: ${message.template}`);
}

async function claimBatch(limit = 20) {
  const { sequelize, MessageDelivery } = require('../db/models');
  return sequelize.transaction(async (transaction) => {
    const messages = await MessageDelivery.findAll({
      where: {
        status: { [Op.in]: ['pending', 'failed'] },
        availableAt: { [Op.lte]: new Date() },
        attempts: { [Op.lt]: MAX_ATTEMPTS }
      },
      order: [['availableAt', 'ASC'], ['createdAt', 'ASC']],
      limit,
      transaction,
      lock: transaction.LOCK.UPDATE,
      skipLocked: true
    });
    for (const message of messages) {
      await message.update({
        status: 'processing',
        attempts: message.attempts + 1
      }, { transaction });
    }
    return messages;
  });
}

async function processOutbox(limit = 20) {
  const messages = await claimBatch(limit);
  let processed = 0;
  for (const message of messages) {
    try {
      const content = renderMessage(message);
      await sendEmail({
        to: message.recipient,
        ...content
      });
      await message.update({ status: 'sent', sentAt: new Date(), lastError: null });
      processed += 1;
    } catch (error) {
      const exhausted = message.attempts >= MAX_ATTEMPTS;
      const delayMinutes = Math.min(60, 2 ** message.attempts);
      await message.update({
        status: exhausted ? 'dead' : 'failed',
        availableAt: new Date(Date.now() + delayMinutes * 60 * 1000),
        lastError: error.message
      });
      logger.error({
        err: error,
        messageDeliveryId: message.id,
        attempts: message.attempts
      }, 'Message delivery failed');
    }
  }
  return { claimed: messages.length, processed };
}

module.exports = { processOutbox, claimBatch, renderMessage };
