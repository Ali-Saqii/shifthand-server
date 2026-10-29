const eventSchema = require('../../src/modules/events/events.schema');
const shiftSchema = require('../../src/modules/shifts/shifts.schema');

describe('Day 7 event and shift validation', () => {
  test('requires event title and ISO date fields', () => {
    const result = eventSchema.createEvent.validate({
      startsAt: 'not-a-date',
      endsAt: '2026-11-10T17:00:00.000Z'
    }, { abortEarly: false });

    expect(result.error).toBeDefined();
    expect(result.error.details.map((detail) => detail.path.join('.'))).toEqual(
      expect.arrayContaining(['title', 'startsAt'])
    );
  });

  test('rejects invalid pagination limits', () => {
    const result = eventSchema.listQuery.validate({ limit: 101 });

    expect(result.error).toBeDefined();
  });

  test('accepts a valid draft event creation payload', () => {
    const result = eventSchema.createEvent.validate({
      title: 'Community Food Drive',
      startsAt: '2026-11-10T09:00:00.000Z',
      endsAt: '2026-11-10T17:00:00.000Z'
    });

    expect(result.error).toBeUndefined();
  });

  test('requires confirmation to be boolean for shift changes', () => {
    const result = shiftSchema.updateShift.validate({
      capacity: 10,
      confirmChange: 'yes'
    });

    expect(result.error).toBeDefined();
  });
});
