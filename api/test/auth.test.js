jest.mock('../config/db', () => ({ query: jest.fn() }));

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../server');
const db = require('../config/db');
const { users, bearer } = require('./helpers');

beforeEach(() => {
  db.query.mockReset();
});

describe('POST /api/auth/register', () => {
  const body = { name: 'Ali Khan', email: 'ali@test.com', password: 'Secret123' };

  it('registers a user with 201', async () => {
    db.query.mockResolvedValueOnce([{ insertId: 5 }]);
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).toBe(201);
  });

  it('stores a hashed password, not the plain one', async () => {
    db.query.mockResolvedValueOnce([{ insertId: 5 }]);
    await request(app).post('/api/auth/register').send(body);
    const params = db.query.mock.calls[0][1];
    expect(params).not.toContain(body.password);
    expect(params.some((p) => String(p).startsWith('$2'))).toBe(true);
  });

  it('ignores a role sent by the client', async () => {
    db.query.mockResolvedValueOnce([{ insertId: 5 }]);
    await request(app).post('/api/auth/register').send({ ...body, role: 'admin' });
    db.query.mock.calls.forEach(([, params]) => {
      expect(params).not.toContain('admin');
    });
  });

  it('returns 422 with the failing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'bad' });
    expect(res.status).toBe(422);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });
});

describe('POST /api/auth/login', () => {
  const row = { ...users.customer, name: 'Ali', password_hash: bcrypt.hashSync('Secret123', 4) };

  it('returns a token for correct credentials', async () => {
    db.query.mockResolvedValueOnce([[row]]);
    const res = await request(app).post('/api/auth/login').send({ email: row.email, password: 'Secret123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(JSON.stringify(res.body)).not.toContain('password_hash');
  });

  it('returns 401 for a wrong password', async () => {
    db.query.mockResolvedValueOnce([[row]]);
    const res = await request(app).post('/api/auth/login').send({ email: row.email, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for an unknown email', async () => {
    db.query.mockResolvedValueOnce([[]]);
    const res = await request(app).post('/api/auth/login').send({ email: 'x@test.com', password: 'Secret123' });
    expect(res.status).toBe(401);
  });
});

describe('token check', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/resources');
    expect(res.status).toBe(401);
  });

  it('returns 401 for an expired token', async () => {
    const res = await request(app).get('/api/resources').set('Authorization', bearer('customer', { expiresIn: -10 }));
    expect(res.status).toBe(401);
  });
});
