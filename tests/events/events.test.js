jest.mock('../../src/db/models', () => ({
  Event: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn()
  }
}));

const { Event } = require('../../src/db/models');
const eventService = require('../../src/modules/events/events.service');

describe('event lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a draft event with a unique public slug', async () => {
    Event.findOne.mockResolvedValueOnce(null);
    Event.create.mockResolvedValue({ id: 'event-1', status: 'draft' });

    await eventService.create('org-1', {
      title: 'Community Food Drive',
      startsAt: '2026-11-10T09:00:00.000Z',
      endsAt: '2026-11-10T17:00:00.000Z'
    });

    expect(Event.create).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: 'org-1',
      publicSlug: 'community-food-drive',
      status: 'draft'
    }));
  });

  test('adds a numeric suffix when a public slug is taken', async () => {
    Event.findOne
      .mockResolvedValueOnce({ id: 'existing' })
      .mockResolvedValueOnce(null);
    Event.create.mockResolvedValue({});

    await eventService.create('org-1', {
      title: 'Community Food Drive',
      startsAt: '2026-11-10T09:00:00.000Z',
      endsAt: '2026-11-10T17:00:00.000Z'
    });

    expect(Event.create).toHaveBeenCalledWith(expect.objectContaining({
      publicSlug: 'community-food-drive-2'
    }));
  });

  test('publishes a draft event and rejects a second publish', async () => {
    const event = {
      id: 'event-1',
      status: 'draft',
      update: jest.fn(async (values) => Object.assign(event, values))
    };
    Event.findOne.mockResolvedValue(event);

    await eventService.publish('org-1', 'event-1');
    expect(event.status).toBe('published');

    await expect(eventService.publish('org-1', 'event-1'))
      .rejects.toMatchObject({ code: 'INVALID_EVENT_STATUS', statusCode: 409 });
  });

  test('cancels a published event and exposes only published public events', async () => {
    const event = {
      id: 'event-1',
      status: 'published',
      update: jest.fn(async (values) => Object.assign(event, values))
    };
    Event.findOne.mockResolvedValueOnce(event);

    await eventService.cancel('org-1', 'event-1');
    expect(event.status).toBe('cancelled');

    Event.findOne.mockResolvedValueOnce(null);
    await expect(eventService.getPublic('community-food-drive'))
      .rejects.toMatchObject({ code: 'EVENT_NOT_FOUND', statusCode: 404 });
  });
});
