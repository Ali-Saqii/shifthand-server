jest.mock('../../src/db/models', () => ({
  Event: { findByPk: jest.fn() },
  Shift: { findOne: jest.fn(), create: jest.fn(), findAll: jest.fn() },
  Signup: { count: jest.fn() },
  Membership: { findOne: jest.fn() }
}));

const { Event, Shift, Signup, Membership } = require('../../src/db/models');
const shiftService = require('../../src/modules/shifts/shifts.service');

const event = {
  id: 'event-1',
  organizationId: 'org-1',
  startsAt: '2026-11-10T09:00:00.000Z',
  endsAt: '2026-11-10T17:00:00.000Z'
};

describe('shift lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Event.findByPk.mockResolvedValue(event);
    Signup.count.mockResolvedValue(0);
    Membership.findOne.mockResolvedValue({ organizationId: 'org-1', userId: 'lead-1' });
  });

  test('creates a shift with UTC edge fields and validates its event bounds', async () => {
    Shift.create.mockResolvedValue({ id: 'shift-1' });

    await shiftService.create('event-1', {
      title: 'Morning Setup',
      startsAt: '2026-11-10T09:00:00.000Z',
      endsAt: '2026-11-10T12:00:00.000Z',
      capacity: 10,
      leadUserId: 'lead-1'
    });

    expect(Shift.create).toHaveBeenCalledWith(expect.objectContaining({
      eventId: 'event-1',
      startsAtUtc: '2026-11-10T09:00:00.000Z',
      endsAtUtc: '2026-11-10T12:00:00.000Z'
    }));
  });

  test('requires confirmation when changing a shift with active signups', async () => {
    const shift = {
      id: 'shift-1',
      eventId: 'event-1',
      startsAt: event.startsAt,
      endsAt: '2026-11-10T12:00:00.000Z',
      capacity: 10
    };
    Shift.findOne.mockResolvedValue(shift);
    Signup.count.mockResolvedValue(1);

    await expect(shiftService.update('event-1', 'shift-1', { capacity: 12 }, {}))
      .rejects.toMatchObject({
        statusCode: 409,
        code: 'SHIFT_CHANGE_CONFIRMATION_REQUIRED'
      });
  });

  test('does not reduce capacity below active signup count', async () => {
    const shift = {
      id: 'shift-1',
      eventId: 'event-1',
      startsAt: event.startsAt,
      endsAt: '2026-11-10T12:00:00.000Z',
      capacity: 10,
      update: jest.fn()
    };
    Shift.findOne.mockResolvedValue(shift);
    Signup.count.mockResolvedValue(5);

    await expect(shiftService.update(
      'event-1',
      'shift-1',
      { capacity: 3, confirmChange: true },
      {}
    )).rejects.toMatchObject({
      statusCode: 409,
      code: 'SHIFT_CAPACITY_BELOW_SIGNUPS'
    });
  });

  test('cancels instead of deleting a shift with confirmation', async () => {
    const shift = {
      id: 'shift-1',
      eventId: 'event-1',
      status: 'active',
      update: jest.fn(async (values) => Object.assign(shift, values))
    };
    Shift.findOne.mockResolvedValue(shift);
    Signup.count.mockResolvedValue(2);

    await shiftService.cancel('event-1', 'shift-1', { confirmChange: true });

    expect(shift.update).toHaveBeenCalledWith({ status: 'cancelled' });
    expect(shift.status).toBe('cancelled');
  });

  test('scopes shift leads to their assigned shifts', async () => {
    Shift.findAll.mockResolvedValue([]);

    await shiftService.list('event-1', { id: 'lead-1' }, { role: 'shift_lead' });

    expect(Shift.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { eventId: 'event-1', status: 'active', leadUserId: 'lead-1' }
    }));
  });
});
