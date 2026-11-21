jest.mock('../../src/db/models', () => ({
  sequelize: { transaction: jest.fn() },
  Volunteer: { findByPk: jest.fn() },
  VolunteerAccessToken: { findOne: jest.fn() },
  Shift: { findByPk: jest.fn() },
  Event: { findByPk: jest.fn() },
  Signup: { findOne: jest.fn(), findAll: jest.fn(), count: jest.fn(), create: jest.fn() },
  MessageDelivery: { create: jest.fn() },
  IdempotencyKey: { findOne: jest.fn(), create: jest.fn() }
}));

const models = require('../../src/db/models');
const signupService = require('../../src/modules/volunteers/signup.service');

describe('volunteer signup transaction', () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };

  beforeEach(() => {
    jest.clearAllMocks();
    models.sequelize.transaction.mockImplementation((callback) => callback(transaction));
    models.Signup.findAll.mockResolvedValue([]);
  });

  test('creates an unverified hold and confirmation outbox row', async () => {
    const volunteer = { id: 'volunteer-1', blocked: false, email: 'alex@example.com', name: 'Alex' };
    const shift = {
      id: 'shift-1',
      eventId: 'event-1',
      title: 'Setup',
      startsAt: new Date(Date.now() + 3600000),
      capacity: 2,
      status: 'active'
    };
    const event = {
      id: 'event-1',
      organizationId: 'org-1',
      status: 'published',
      startsAt: new Date(Date.now() + 1800000)
    };
    const signup = {
      id: 'signup-1',
      shiftId: 'shift-1',
      status: 'unverified',
      holdExpiresAt: new Date(Date.now() + 7200000)
    };
    models.IdempotencyKey.findOne.mockResolvedValue(null);
    models.VolunteerAccessToken.findOne.mockResolvedValue({ volunteerId: volunteer.id });
    models.Volunteer.findByPk.mockResolvedValue(volunteer);
    models.Shift.findByPk.mockResolvedValue(shift);
    models.Event.findByPk.mockResolvedValue(event);
    models.Signup.findOne.mockResolvedValue(null);
    models.Signup.count.mockResolvedValue(0);
    models.Signup.create.mockResolvedValue(signup);
    models.MessageDelivery.create.mockResolvedValue({});
    models.IdempotencyKey.create.mockResolvedValue({});

    const result = await signupService.create('shift-1', 'a'.repeat(64), 'request-1');

    expect(result.signup.status).toBe('unverified');
    expect(models.Signup.create).toHaveBeenCalledWith(
      expect.objectContaining({ volunteerId: 'volunteer-1', status: 'unverified' }),
      { transaction }
    );
    expect(models.MessageDelivery.create).toHaveBeenCalledWith(
      expect.objectContaining({ template: 'signup-confirmation' }),
      { transaction }
    );
  });

  test('rejects signup without an open published event', async () => {
    models.IdempotencyKey.findOne.mockResolvedValue(null);
    models.VolunteerAccessToken.findOne.mockResolvedValue({ volunteerId: 'volunteer-1' });
    models.Volunteer.findByPk.mockResolvedValue({ id: 'volunteer-1', blocked: false });
    models.Shift.findByPk.mockResolvedValue({
      eventId: 'event-1',
      startsAt: new Date(Date.now() + 3600000),
      status: 'active'
    });
    models.Event.findByPk.mockResolvedValue({ status: 'draft' });

    await expect(signupService.create('shift-1', 'a'.repeat(64), 'request-1'))
      .rejects.toMatchObject({ code: 'EVENT_NOT_OPEN', statusCode: 409 });
  });

  test('allows back-to-back shifts and rejects overlapping shifts', () => {
    expect(signupService.shiftsOverlap(
      { startsAt: '2026-11-20T09:00:00Z', endsAt: '2026-11-20T12:00:00Z' },
      { startsAt: '2026-11-20T12:00:00Z', endsAt: '2026-11-20T15:00:00Z' }
    )).toBe(false);

    expect(signupService.shiftsOverlap(
      { startsAt: '2026-11-20T09:00:00Z', endsAt: '2026-11-20T12:00:00Z' },
      { startsAt: '2026-11-20T11:59:59Z', endsAt: '2026-11-20T14:00:00Z' }
    )).toBe(true);
  });

  test('identifies MySQL deadlock error 1213', () => {
    expect(signupService.isMySqlDeadlock({ errno: 1213 })).toBe(true);
    expect(signupService.isMySqlDeadlock({ original: { code: 'ER_LOCK_DEADLOCK' } })).toBe(true);
    expect(signupService.isMySqlDeadlock({ errno: 1062 })).toBe(false);
  });

  test('retries deadlocks up to three transaction attempts', async () => {
    let attempts = 0;
    const sequelize = {
      transaction: jest.fn(async (operation) => {
        attempts += 1;
        if (attempts < 3) throw { errno: 1213 };
        return operation();
      })
    };

    await expect(signupService.createWithRetry(
      sequelize,
      async () => 'success'
    )).resolves.toBe('success');
    expect(sequelize.transaction).toHaveBeenCalledTimes(3);
  });
});
