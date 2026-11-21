jest.mock('../../src/db/models', () => ({
  Signup: { update: jest.fn() }
}));

const { Signup } = require('../../src/db/models');
const { expireUnverifiedSignups } = require('../../src/jobs/expired-holds');

describe('expired holds job', () => {
  test('expires old unverified signups', async () => {
    Signup.update.mockResolvedValue([3]);
    await expect(expireUnverifiedSignups(new Date()))
      .resolves.toEqual({ expired: 3 });
  });
});
