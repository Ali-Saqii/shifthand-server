const mockState = {
  signups: new Set(),
  transactionQueue: Promise.resolve()
};

jest.mock('../../src/db/models', () => ({
  sequelize: {
    transaction(callback) {
      const run = mockState.transactionQueue.then(() => callback({
        LOCK: { UPDATE: 'UPDATE' }
      }));
      mockState.transactionQueue = run.catch(() => {});
      return run;
    }
  },
  Shift: {
    findByPk: jest.fn().mockResolvedValue({ id: 'shift-1', capacity: 2 })
  },
  Signup: {
    findOne: jest.fn(({ where }) => Promise.resolve(
      mockState.signups.has(`${where.shiftId}:${where.userId}`)
        ? { id: 'existing' }
        : null
    )),
    count: jest.fn(() => Promise.resolve(mockState.signups.size)),
    create: jest.fn(({ shiftId, userId }) => {
      mockState.signups.add(`${shiftId}:${userId}`);
      return Promise.resolve({ id: `${shiftId}:${userId}` });
    })
  }
}));

const { create } = require('../../src/modules/signups/signups.service');

describe('signup concurrency', () => {
  beforeEach(() => {
    mockState.signups.clear();
    mockState.transactionQueue = Promise.resolve();
  });

  test('confirms no more signups than the shift capacity', async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, (_, index) => create('shift-1', `user-${index}`))
    );

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(2);
    expect(results.filter((result) => (
      result.status === 'rejected' && result.reason.code === 'SHIFT_CAPACITY_REACHED'
    ))).toHaveLength(3);
    expect(mockState.signups.size).toBe(2);
  });
});