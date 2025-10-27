const request = require('supertest');

// Use a fresh mock per test file for database
const mockQuery = jest.fn();
jest.mock('../config/database', () => ({
  pool: { query: (...args) => mockQuery(...args) },
  testConnection: jest.fn().mockResolvedValue(),
}));

const app = require('../app');

describe('Health endpoint', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  test('returns 200 when DB is connected', async () => {
    mockQuery.mockResolvedValueOnce([[{ '1': 1 }]]);
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.database.status).toBe('connected');
  });

  test('returns 503 when DB is disconnected', async () => {
    mockQuery.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(503);
    expect(res.body.database.status).toBe('disconnected');
  });
});