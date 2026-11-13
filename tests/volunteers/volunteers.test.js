jest.mock('../../src/db/models', () => ({
  Organization: { findByPk: jest.fn() },
  Volunteer: { findOrCreate: jest.fn() },
  VolunteerAccessToken: {
    update: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn()
  },
  MessageDelivery: { create: jest.fn() }
}));

const {
  Organization, Volunteer, VolunteerAccessToken, MessageDelivery
} = require('../../src/db/models');
const volunteerService = require('../../src/modules/volunteers/volunteers.service');

describe('volunteer access', () => {
  beforeEach(() => jest.clearAllMocks());

  test('creates a volunteer token and queues an access email', async () => {
    Organization.findByPk.mockResolvedValue({ id: 'org-1' });
    const volunteer = {
      id: 'volunteer-1',
      name: 'Alex',
      email: 'alex@example.com',
      phone: null,
      blocked: false,
      update: jest.fn()
    };
    Volunteer.findOrCreate.mockResolvedValue([volunteer, true]);
    VolunteerAccessToken.update.mockResolvedValue([1]);
    VolunteerAccessToken.create.mockResolvedValue({});
    MessageDelivery.create.mockResolvedValue({});

    await expect(volunteerService.requestAccess('org-1', {
      name: 'Alex',
      email: 'Alex@example.com',
      consent: true
    })).resolves.toMatchObject({ message: expect.any(String) });

    expect(VolunteerAccessToken.create).toHaveBeenCalledWith(expect.objectContaining({
      volunteerId: 'volunteer-1',
      tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/)
    }));
    expect(MessageDelivery.create).toHaveBeenCalledWith(expect.objectContaining({
      recipient: 'alex@example.com',
      template: 'volunteer-access',
      channel: 'email',
      payload: expect.objectContaining({
        accessUrl: expect.stringMatching(/\/v\/access\/[a-f0-9]{64}$/)
      })
    }));
  });

  test('rejects blocked volunteers', async () => {
    Organization.findByPk.mockResolvedValue({ id: 'org-1' });
    Volunteer.findOrCreate.mockResolvedValue([{
      id: 'volunteer-1',
      blocked: true,
      update: jest.fn()
    }, false]);

    await expect(volunteerService.requestAccess('org-1', {
      name: 'Alex',
      email: 'alex@example.com',
      consent: true
    })).rejects.toMatchObject({
      code: 'VOLUNTEER_BLOCKED',
      statusCode: 403
    });
  });
});
