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

  describe('API errors', () => {
    it('returns a JSON 404 for unknown routes', async () => {
      const response = await request(app).get('/does-not-exist');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: 'Route not found'
        }
      });
    });

    it('returns a JSON 400 for malformed JSON', async () => {
      const response = await request(app)
        .post('/auth/login')
        .set('content-type', 'application/json')
        .send('{"email":');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_JSON');
    });

    it('rate limits repeated authentication requests', async () => {
      const responses = await Promise.all(
        Array.from({ length: 21 }, () => request(app).post('/auth/login').send({
          email: 'invalid@example.com',
          password: 'password123'
        }))
      );

      expect(responses.at(-1).status).toBe(429);
      expect(responses.at(-1).body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
});
