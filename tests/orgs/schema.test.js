const schema = require('../../src/modules/orgs/orgs.schema');

describe('organisation request schemas', () => {
  test('invite body does not require the URL organization id', () => {
    const result = schema.invite.validate({
      email: 'coordinator@example.com',
      role: 'coordinator'
    });

    expect(result.error).toBeUndefined();
  });

  test('member role update body only requires role', () => {
    const result = schema.updateMember.validate({ role: 'coordinator' });

    expect(result.error).toBeUndefined();
  });
});
