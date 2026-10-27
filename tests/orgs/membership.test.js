jest.mock('../../src/db/models', () => ({
  Membership: { findOne: jest.fn() }
}));

const { Membership } = require('../../src/db/models');
const loadMembership = require('../../src/middleware/loadMembership');

describe('organisation membership isolation', () => {
  beforeEach(() => {
    Membership.findOne.mockReset();
  });

  test('returns a 404 for a non-member', async () => {
    Membership.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await loadMembership({
      params: { organizationId: 'org-1' },
      user: { id: 'user-1' },
      get: () => undefined
    }, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 404,
      code: 'ORGANIZATION_NOT_FOUND'
    }));
  });

  test('rejects a conflicting X-Org-Id header with a 404', async () => {
    const next = jest.fn();

    await loadMembership({
      params: { organizationId: 'org-1' },
      user: { id: 'user-1' },
      get: () => 'org-2'
    }, {}, next);

    expect(Membership.findOne).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 404,
      code: 'ORGANIZATION_NOT_FOUND'
    }));
  });
});
