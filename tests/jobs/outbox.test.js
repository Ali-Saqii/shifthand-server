jest.mock('../../src/lib/email', () => ({
  sendEmail: jest.fn()
}));

const { renderMessage } = require('../../src/jobs/outbox');

describe('message outbox', () => {
  test('renders volunteer access messages safely', () => {
    const message = renderMessage({
      template: 'volunteer-access',
      payload: {
        name: '<Alex>',
        accessUrl: 'https://example.com/v/access/token'
      }
    });

    expect(message.subject).toBe('Your ShiftHand volunteer access link');
    expect(message.html).toContain('&lt;Alex&gt;');
    expect(message.html).not.toContain('<Alex>');
    expect(message.text).toContain('https://example.com/v/access/token');
  });
});
