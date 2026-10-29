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
    expect(response.headers['x-request-id']).toEqual(expect.any(String));
    expect(response.body).toEqual({
      data: {
        status: 'ok',
        database: 'connected'
      }
    });
  });

  it('supports the guide health endpoint and versioned API namespace', async () => {
    const health = await request(app).get('/healthz');
    const versionedHealth = await request(app).get('/api/v1/healthz');
    const versionedLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'invalid@example.com',
        password: 'password123',
        unexpected: true
      });

    expect(health.status).toBe(200);
    expect(versionedHealth.status).toBe(200);
    expect(versionedHealth.body).toEqual(health.body);
    expect(versionedLogin.status).toBe(422);
    expect(versionedLogin.body.error.code).toBe('VALIDATION_ERROR');
  });

  describe('API errors', () => {
    it('preserves a valid request id', async () => {
      const response = await request(app)
        .get('/health')
        .set('x-request-id', 'test-request-123');

      expect(response.headers['x-request-id']).toBe('test-request-123');
    });

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

    it('returns validation details and rejects unknown fields', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'password123',
          unexpected: true
        });

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: {
            fields: {
              unexpected: '"unexpected" is not allowed'
            }
          }
        }
      });
    });

    it('returns a generic response for unexpected errors', async () => {
      const response = await request(app).get('/__test__/error');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      });
      expect(response.body.error.stack).toBeUndefined();
    });

    it('rate limits repeated authentication requests', async () => {
      const responses = await Promise.all(
        Array.from({ length: 21 }, () => request(app).post('/auth/login').send({
          email: 'invalid@example.com',
          password: 'password123',
          unexpected: true
        }))
      );

      expect(responses.at(-1).status).toBe(429);
      expect(responses.at(-1).body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
});
