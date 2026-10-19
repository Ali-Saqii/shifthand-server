const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function getApnsConfig() {
  const values = [
    process.env.APNS_KEY_ID,
    process.env.APNS_TEAM_ID,
    process.env.APNS_PRIVATE_KEY,
    process.env.APNS_BUNDLE_ID
  ];
  if (values.some((value) => !value)) {
    throw new Error('APNs configuration is incomplete');
  }
  return {
    keyId: process.env.APNS_KEY_ID,
    teamId: process.env.APNS_TEAM_ID,
    privateKey: process.env.APNS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    bundleId: process.env.APNS_BUNDLE_ID
  };
}

async function sendPushNotification(deviceToken, payload) {
  const apns = getApnsConfig();
  const token = jwt.sign({}, apns.privateKey, {
    algorithm: 'ES256',
    keyid: apns.keyId,
    issuer: apns.teamId,
    expiresIn: '1h'
  });
  const response = await fetch(`https://api.push.apple.com/3/device/${encodeURIComponent(deviceToken)}`, {
    method: 'POST',
    headers: {
      authorization: `bearer ${token}`,
      'apns-topic': apns.bundleId,
      'apns-id': crypto.randomUUID(),
      'content-type': 'application/json'
    },
    body: JSON.stringify({ aps: { alert: payload, sound: 'default' } })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`APNs request failed (${response.status}): ${details}`);
  }
}

module.exports = { sendPushNotification };