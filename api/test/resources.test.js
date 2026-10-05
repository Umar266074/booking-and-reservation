const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const { bearer } = require('./helpers');
const { resetDatabase } = require('./testDb');

const as = (role) => (req) => req.set('Authorization', bearer(role));

beforeAll(resetDatabase);
afterAll(() => db.end());

describe('GET /api/resources', () => {
  it('customer sees active resources only', async () => {
    const res = await as('customer')(request(app).get('/api/resources'));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(5);
    expect(res.body.every((r) => r.is_active === 1)).toBe(true);
  });

  it('provider and admin also see inactive resources', async () => {
    const provider = await as('provider')(request(app).get('/api/resources'));
    const admin = await as('admin')(request(app).get('/api/resources'));
    expect(provider.body).toHaveLength(6);
    expect(admin.body).toHaveLength(6);
  });

  it('?is_active=false filters for provider/admin', async () => {
    const res = await as('admin')(request(app).get('/api/resources?is_active=false'));
    expect(res.body.map((r) => r.id)).toEqual([6]);
  });
});

describe('GET /api/resources/:id', () => {
  it('returns one resource', async () => {
    const res = await as('customer')(request(app).get('/api/resources/1'));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, name: 'Room A', owner_id: 10 });
  });

  it('404 for a missing resource', async () => {
    const res = await as('customer')(request(app).get('/api/resources/9999'));
    expect(res.status).toBe(404);
  });
});

describe('POST /api/resources', () => {
  it('provider creates a resource; owner_id comes from the token (FR-5)', async () => {
    const res = await as('provider')(request(app).post('/api/resources')).send({
      name: 'New Room', description: 'Nice', capacity: 3, duration_minutes: 45,
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'New Room', capacity: 3, duration_minutes: 45, owner_id: 10 });
    const [[row]] = await db.query('SELECT owner_id, is_active FROM resources WHERE id = ?', [res.body.id]);
    expect(row).toMatchObject({ owner_id: 10, is_active: 1 });
  });

  it('client cannot choose owner_id (extra field -> 422)', async () => {
    const res = await as('provider')(request(app).post('/api/resources')).send({ name: 'Sneaky', owner_id: 11 });
    expect(res.status).toBe(422);
    expect(res.body.errors.map((e) => e.field)).toContain('owner_id');
  });

  it('applies defaults (capacity 1, duration 30)', async () => {
    const res = await as('provider')(request(app).post('/api/resources')).send({ name: 'Plain' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ capacity: 1, duration_minutes: 30 });
  });

  it('admin can create too', async () => {
    const res = await as('admin')(request(app).post('/api/resources')).send({ name: 'Admin Room' });
    expect(res.status).toBe(201);
    expect(res.body.owner_id).toBe(99);
  });

  it.each([
    ['name too short', { name: 'a' }, 'name'],
    ['name too long', { name: 'x'.repeat(151) }, 'name'],
    ['name missing', { description: 'no name' }, 'name'],
    ['capacity zero', { name: 'Okay', capacity: 0 }, 'capacity'],
    ['duration negative', { name: 'Okay', duration_minutes: -5 }, 'duration_minutes'],
    ['is_active not boolean', { name: 'Okay', is_active: 'maybe' }, 'is_active'],
  ])('422 with the failing field: %s', async (_n, body, field) => {
    const res = await as('provider')(request(app).post('/api/resources')).send(body);
    expect(res.status).toBe(422);
    expect(res.body.errors.map((e) => e.field)).toContain(field);
  });
});

describe('PUT /api/resources/:id', () => {
  const full = { name: 'Room A v2', description: 'Updated', capacity: 6, duration_minutes: 60, is_active: true };

  it('owner updates their resource', async () => {
    const res = await as('provider')(request(app).put('/api/resources/1')).send(full);
    expect(res.status).toBe(200);
    const [[row]] = await db.query('SELECT name, capacity, duration_minutes FROM resources WHERE id = 1');
    expect(row).toMatchObject({ name: 'Room A v2', capacity: 6, duration_minutes: 60 });
  });

  it('admin updates any resource', async () => {
    const res = await as('admin')(request(app).put('/api/resources/3')).send({ ...full, name: 'By Admin' });
    expect(res.status).toBe(200);
  });

  it('404 for a missing resource', async () => {
    const res = await as('provider')(request(app).put('/api/resources/9999')).send(full);
    expect(res.status).toBe(404);
  });

  it('422 for invalid data', async () => {
    const res = await as('provider')(request(app).put('/api/resources/1')).send({ ...full, name: 'a' });
    expect(res.status).toBe(422);
  });
});

describe('DELETE /api/resources/:id (soft delete / deactivate)', () => {
  it('owner deactivates; the row stays and customers stop seeing it', async () => {
    const created = await as('provider')(request(app).post('/api/resources')).send({ name: 'To Remove' });
    const del = await as('provider')(request(app).delete(`/api/resources/${created.body.id}`));
    expect(del.status).toBe(200);

    const [[row]] = await db.query('SELECT is_active FROM resources WHERE id = ?', [created.body.id]);
    expect(row.is_active).toBe(0);

    const list = await as('customer')(request(app).get('/api/resources'));
    expect(list.body.map((r) => r.id)).not.toContain(created.body.id);
  });

  it('404 for a missing resource', async () => {
    const res = await as('provider')(request(app).delete('/api/resources/9999'));
    expect(res.status).toBe(404);
  });
});
