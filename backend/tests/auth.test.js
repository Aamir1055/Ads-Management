const request = require('supertest');

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock token generation and refresh storage
jest.mock('../middleware/authMiddleware', () => ({
  generateTokens: jest.fn(() => ({ accessToken: 'access.token', refreshToken: 'refresh.token', tokenId: 'tid' })),
  storeRefreshToken: jest.fn().mockResolvedValue(),
  refreshAccessToken: (req, res) => res.status(501).json({ success: false, message: 'Not implemented in tests' }),
  authenticateToken: (req, _res, next) => { req.user = { id: 1, role_id: 1, permissions: ['users_read','users_update','users_delete','users_manage_roles'] }; next(); },
  requirePermission: () => (req, _res, next) => next(),
  requireRole: () => (req, _res, next) => next(),
  requireAdmin: (req, _res, next) => next(),
  requireSuperAdmin: (req, _res, next) => next(),
}));

// Mock protect/authorize to bypass DB lookups
jest.mock('../middleware/auth', () => ({
  protect: (req, _res, next) => { req.user = { id: 1, role_id: 1 }; next(); },
  authorize: () => (req, _res, next) => next(),
}));

// Mock User model heavy DB calls
jest.mock('../models/User', () => ({
  findByUsername: jest.fn(async (username) => {
    if (username === 'nouser') return null;
    if (username === 'user2fa') return { id: 2, username, hashed_password: 'hash', role_id: 2, is_2fa_enabled: 1 };
    return { id: 1, username, hashed_password: 'hash', role_id: 1, is_2fa_enabled: 0 };
  }),
  findById: jest.fn(async (id) => {
    if (id === 404) return null;
    return { id, username: id === 2 ? 'user2fa' : 'test', role_id: 1, role_name: 'Admin', is_2fa_enabled: id === 2 };
  }),
  findByIdWithSecret: jest.fn(async (id) => ({ id, username: 'test', is_2fa_enabled: !!(id % 2) })),
  updateLastLogin: jest.fn().mockResolvedValue(),
  needs2FASetup: jest.fn(async (id) => id === 2),
  generate2FASetup: jest.fn(async () => ({ qrCode: 'data:image/png;base64,AAA' })),
  verify2FA: jest.fn(async (_id, token) => token === '123456'),
}));

// Mock database module for any incidental import
jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn().mockResolvedValue([[{ ok: 1 }]]),
    execute: jest.fn().mockResolvedValue([[{ ok: 1 }]]),
  },
  testConnection: jest.fn().mockResolvedValue(),
}));

const express = require('express');
let app;

beforeAll(() => {
  jest.resetModules();
  jest.isolateModules(() => {
    const authRoutes = require('../routes/authRoutes');
    const inst = express();
    inst.use(express.json());
    inst.use('/api/auth', authRoutes);
    app = inst;
  });
});

describe('Auth flows', () => {
  test('Login success without 2FA returns tokens', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'plainuser', password: 'secret' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requires_2fa).toBe(false);
    expect(res.body.data).toHaveProperty('access_token');
    expect(res.body.data).toHaveProperty('refresh_token');
  });

  test('Login requires 2FA when enabled and setup needed', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'user2fa', password: 'secret' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    // When 2FA is enabled and setup is required (first login), API returns requires_2fa_setup
    expect(res.body.data).toHaveProperty('requires_2fa_setup', true);
    expect(res.body.data).toHaveProperty('qr_code');
  });

  test('Login fails with invalid user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nouser', password: 'secret' });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('2FA login success issues tokens', async () => {
    const res = await request(app)
      .post('/api/auth/login-2fa')
      .send({ user_id: 2, token: '123456' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('access_token');
  });

  test('2FA login fails on bad token format', async () => {
    const res = await request(app)
      .post('/api/auth/login-2fa')
      .send({ user_id: 2, token: 'abc' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});