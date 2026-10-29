const requireRole = require('../../src/middleware/requireRole');

describe('Day 7 staff route policy', () => {
  test('denies shift leads from organisation management routes', () => {
    const next = jest.fn();
    requireRole('owner', 'coordinator')(
      { membership: { role: 'shift_lead' } },
      {},
      next
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 403,
      code: 'INSUFFICIENT_ORGANIZATION_PERMISSIONS'
    }));
  });

  test('allows coordinators on organisation management routes', () => {
    const next = jest.fn();
    requireRole('owner', 'coordinator')(
      { membership: { role: 'coordinator' } },
      {},
      next
    );

    expect(next).toHaveBeenCalledWith();
  });
});
