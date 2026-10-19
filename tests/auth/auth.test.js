process.env.NODE_ENV = 'test';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_NAME = 'shifthand_test';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = '';
process.env.JWT_ACCESS_SECRET = '12345678901234567890123456789012';
process.env.JWT_REFRESH_SECRET = 'abcdefghijklmnopqrstuvwxyz123456';

jest.mock('../../src/db', () => ({
  authenticate: jest.fn().mockResolvedValue()
}));

const request = require('supertest');
const app = require('../../src/app');
const {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken
} = require('../../src/lib/tokens');
const schemas = require('../../src/modules/auth/auth.schema');

describe('authentication security', () => {
  it('creates and verifies an access token with the access type', () => {
    const token = createAccessToken({ id: 'user-1' });
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe('user-1');
    expect(payload.type).toBe('access');
  });

  it('uses a separate refresh-token secret and type', () => {
    const token = createRefreshToken({ id: 'user-1' });
    const payload = verifyRefreshToken(token);

    expect(payload.sub).toBe('user-1');
    expect(payload.type).toBe('refresh');
    expect(payload.jti).toEqual(expect.any(String));
    expect(() => verifyAccessToken(token)).toThrow();
  });

  it('hashes the same refresh token deterministically without exposing it', () => {
    const token = createRefreshToken({ id: 'user-1' });

    expect(hashToken(token)).toHaveLength(64);
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
  });

  it('rejects a refresh token on protected access routes', async () => {
    const response = await request(app)
      .get('/orgs')
      .set('authorization', `Bearer ${createRefreshToken({ id: 'user-1' })}`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_ACCESS_TOKEN');
  });

  it('requires name during registration and excludes it from login validation', () => {
    expect(schemas.register.validate({
      email: 'user@example.com',
      password: 'password123'
    }).error).toBeTruthy();

    expect(schemas.login.validate({
      email: 'user@example.com',
      password: 'password123'
    }).error).toBeUndefined();
  });
});
