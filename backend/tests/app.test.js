const request = require('supertest');

// Mock database pool for health checks and any incidental DB use
jest.mock('../config/database', () => {
  return {
    pool: {
      query: jest.fn().mockResolvedValue([[{ ok: 1 }]]),
      execute: jest.fn().mockResolvedValue([[{ ok: 1 }]]),
      getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
      end: jest.fn().mockResolvedValue(),
    },
    testConnection: jest.fn().mockResolvedValue(),
  };
});

const app = require('../app');

describe('App basic routes', () => {
  test('GET / responds with API metadata', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Ads Reporting API');
    expect(res.body).toHaveProperty('endpoints');
  });

  test('GET /api/docs returns docs info', async () => {
    const res = await request(app).get('/api/docs');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('baseUrl');
  });

  test('GET /api/health returns status (DB mocked connected)', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('system');
  });

  test('Unknown route returns 404 with JSON body', async () => {
    const res = await request(app).get('/this/route/does/not/exist');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message');
  });
});