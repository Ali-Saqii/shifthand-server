jest.mock('../../src/db/models', () => ({
  Event: { findByPk: jest.fn() },
  Shift: { findByPk: jest.fn() },
  Membership: { findOne: jest.fn() }
}));

const { Event, Shift, Membership } = require('../../src/db/models');
const loadEventMembership = require('../../src/middleware/loadEventMembership');
const loadShiftMembership = require('../../src/middleware/loadShiftMembership');

describe('cross-organisation staff isolation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects an event request with a conflicting organisation header', async () => {
    Event.findByPk.mockResolvedValue({ id: 'event-1', organizationId: 'org-1' });
    const next = jest.fn();

    await loadEventMembership({
      params: { eventId: 'event-1' },
      user: { id: 'user-1' },
      get: () => 'org-2'
    }, {}, next);

    expect(Membership.findOne).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 404,
      code: 'ORGANIZATION_NOT_FOUND'
    }));
  });

  test('rejects a shift request with a conflicting organisation header', async () => {
    Shift.findByPk.mockResolvedValue({ id: 'shift-1', eventId: 'event-1' });
    Event.findByPk.mockResolvedValue({ id: 'event-1', organizationId: 'org-1' });
    const next = jest.fn();

    await loadShiftMembership({
      params: { shiftId: 'shift-1' },
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
