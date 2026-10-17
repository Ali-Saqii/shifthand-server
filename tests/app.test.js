process.env.NODE_ENV = 'test';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_NAME = 'shifthand_test';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = '';
process.env.JWT_ACCESS_SECRET = '12345678901234567890123456789012';
process.env.JWT_REFRESH_SECRET = 'abcdefghijklmnopqrstuvwxyz123456';

jest.mock('../src/db', () => ({
  authenticate: jest.fn().mockResolvedValue()
}));

const request = require('supertest');
const app = require('../src/app');

describe('GET /health', () => {
  it('reports a healthy service when the database is reachable', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        status: 'ok',
        database: 'connected'
      }
    });
  });
});
