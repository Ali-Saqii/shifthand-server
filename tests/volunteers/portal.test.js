jest.mock('../../src/db/models', () => ({
  sequelize: { transaction: jest.fn() },
  VolunteerAccessToken: { findOne: jest.fn() },
  Volunteer: { findByPk: jest.fn() },
  Signup: { update: jest.fn(), findOne: jest.fn(), findAll: jest.fn() },
  Shift: { findByPk: jest.fn() },
  Event: { findByPk: jest.fn() },
  MessageDelivery: { create: jest.fn() },
  Organization: {}
}));

const models = require('../../src/db/models');
const volunteerService = require('../../src/modules/volunteers/volunteer.service');

describe('volunteer portal', () => {
  beforeEach(() => jest.clearAllMocks());

  test('creates a private calendar containing the shift times', async () => {
    models.Signup.findOne.mockResolvedValue({
      id: 'signup-1',
      Shift: {
        id: 'shift-1',
        title: 'Setup',
        startsAt: '2026-11-20T09:00:00Z',
        endsAt: '2026-11-20T12:00:00Z',
        notes: 'Meet at reception',
        Event: {
          title: 'Food Drive',
          location: 'Hall',
          venue: null,
          description: 'Food collection'
        }
      }
    });

    const calendar = await volunteerService.calendarSignup('volunteer-1', 'signup-1');
    expect(calendar).toContain('BEGIN:VCALENDAR');
    expect(calendar).toContain('DTSTART:20261120T090000Z');
    expect(calendar).toContain('DTEND:20261120T120000Z');
    expect(calendar).toContain('SUMMARY:Food Drive - Setup');
  });

  test('returns duplicate cancellation result idempotently', async () => {
    const signup = {
      id: 'signup-1',
      status: 'cancelled',
      update: jest.fn()
    };
    models.sequelize.transaction.mockImplementation((callback) => callback({
      LOCK: { UPDATE: 'UPDATE' }
    }));
    models.Signup.findOne.mockResolvedValue(signup);

    await expect(volunteerService.cancelSignup('volunteer-1', 'signup-1'))
      .resolves.toEqual({ cancelled: true, reused: true });
  });

  test('marks cutoff-aware cancellation as late', async () => {
    const signup = {
      id: 'signup-1',
      shiftId: 'shift-1',
      status: 'confirmed',
      update: jest.fn(async (values) => Object.assign(signup, values))
    };
    models.sequelize.transaction.mockImplementation((callback) => callback({
      LOCK: { UPDATE: 'UPDATE' }
    }));
    models.Signup.findOne.mockResolvedValue(signup);
    models.Shift.findByPk.mockResolvedValue({
      id: 'shift-1',
      eventId: 'event-1',
      startsAt: new Date(Date.now() - 3600000),
      cancelCutoffHours: 24
    });
    models.Event.findByPk.mockResolvedValue({ organizationId: 'org-1' });
    models.Volunteer.findByPk.mockResolvedValue({
      id: 'volunteer-1',
      name: 'Alex',
      email: 'alex@example.com'
    });
    models.MessageDelivery.create.mockResolvedValue({});

    await expect(volunteerService.cancelSignup('volunteer-1', 'signup-1'))
      .resolves.toEqual({ cancelled: true, reused: false });
    expect(signup.lateCancel).toBe(true);
  });
});
