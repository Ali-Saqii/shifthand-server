jest.mock('../../src/db/models', () => ({
  Event: { findOne: jest.fn() },
  Shift: { findAll: jest.fn() },
  Signup: { count: jest.fn() }
}));

const { Event, Shift, Signup } = require('../../src/db/models');
const eventService = require('../../src/modules/events/events.service');

describe('public event page data', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns seats-left state for a published event', async () => {
    Event.findOne.mockResolvedValue({
      id: 'event-1',
      status: 'published',
      title: 'Food drive',
      toJSON: () => ({})
    });
    const shift = {
      id: 'shift-1',
      capacity: 3,
      toJSON: () => ({ id: 'shift-1', title: 'Setup', capacity: 3 })
    };
    Shift.findAll.mockResolvedValue([shift]);
    Signup.count.mockResolvedValue(1);

    await expect(eventService.getPublicPage('food-drive')).resolves.toMatchObject({
      state: 'published',
      shifts: [{ confirmedCount: 1 }]
    });
  });

  test('returns full and cancelled states', async () => {
    Event.findOne.mockResolvedValueOnce({
      id: 'event-1', status: 'published', title: 'Food drive'
    });
    Shift.findAll.mockResolvedValue([{ id: 'shift-1', capacity: 1, toJSON: () => ({ capacity: 1 }) }]);
    Signup.count.mockResolvedValue(1);
    await expect(eventService.getPublicPage('food-drive')).resolves.toMatchObject({ state: 'full' });

    Event.findOne.mockResolvedValueOnce({ id: 'event-2', status: 'cancelled' });
    await expect(eventService.getPublicPage('cancelled')).resolves.toMatchObject({ state: 'cancelled' });
  });
});
