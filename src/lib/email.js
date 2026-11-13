const { Resend } = require('resend');
const config = require('../config');
const logger = require('./logger');

function getClient() {
  if (!config.email.apiKey) {
    throw new Error('EMAIL_API_KEY is required for the Resend email driver');
  }
  return new Resend(config.email.apiKey);
}

async function sendEmail({ to, subject, html, text }) {
  if (config.email.driver === 'console') {
    logger.info({ to, subject }, 'Email delivery (console driver)');
    return { id: `console-${Date.now()}` };
  }
  if (config.email.driver !== 'resend') {
    throw new Error(`Unsupported email driver: ${config.email.driver}`);
  }
  if (!config.email.from) {
    throw new Error('EMAIL_FROM is required for the Resend email driver');
  }
  const { data, error } = await getClient().emails.send({
    from: config.email.from,
    to: [to],
    subject,
    html,
    text
  });
  if (error) {
    throw new Error(`Resend delivery failed: ${error.message || 'unknown error'}`);
  }
  return data;
}

module.exports = { sendEmail };
