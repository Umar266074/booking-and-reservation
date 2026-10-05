const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { resetDatabase } = require('./testDb');

beforeAll(resetDatabase);
afterAll(() => db.end());

const user = { name: 'Newbie', email: 'newbie@test.com', password: 'Secret123' };

describe('register', () => {
  it('creates a customer with a bcrypt-hashed password', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(201);
    expect(JSON.stringify(res.body)).not.toContain(user.password);

    const [[row]] = await db.query('SELECT role, password_hash FROM users WHERE email = ?', [user.email]);
    expect(row.role).toBe('customer');
    expect(row.password_hash).not.toBe(user.password);
    expect(row.password_hash).toMatch(/^\$2[aby]\$/);
  });

  it('ignores a role sent by the client (FR-4)', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Sneaky', email: 'sneaky@test.com', password: 'Secret123', role: 'admin' });
    expect(res.status).toBe(201);
    const [[row]] = await db.query('SELECT role FROM users WHERE email = ?', ['sneaky@test.com']);
    expect(row.role).toBe('customer');
  });

  it('409 for a duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(409);
  });

  it('422 lists every failing field', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'nope', password: '123' });
    expect(res.status).toBe(422);
    expect(res.body.errors.map((e) => e.field).sort()).toEqual(['email', 'name', 'password']);
  });
});

describe('login', () => {
  it('returns a 1-hour JWT with {id, email, role} and no password data', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
    expect(res.status).toBe(200);
    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(payload).toMatchObject({ email: user.email, role: 'customer' });
    expect(payload.exp - payload.iat).toBe(3600);
    expect(res.body.user).toMatchObject({ email: user.email, role: 'customer' });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('401 for a wrong password and for an unknown email (same message)', async () => {
    const wrong = await request(app).post('/api/auth/login').send({ email: user.email, password: 'WrongPass1' });
    const unknown = await request(app).post('/api/auth/login').send({ email: 'ghost@test.com', password: 'Secret123' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });
});
