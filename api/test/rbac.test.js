// Roles table (Section 3): har endpoint par server-side enforcement.
const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const { bearer } = require('./helpers');
const { resetDatabase, DAY1 } = require('./testDb');

const as = (role) => (req) => req.set('Authorization', bearer(role));
const makeBooking = (role, resource_id, start, end) =>
  as(role)(request(app).post('/api/bookings')).send({
    resource_id, specific_date: DAY1, start_time: start, end_time: end,
  });

beforeAll(resetDatabase);
afterAll(() => db.end());

describe('no token -> 401 everywhere', () => {
  it.each([
    ['get', '/api/resources'],
    ['get', '/api/resources/1'],
    ['post', '/api/resources'],
    ['get', '/api/availability'],
    ['post', '/api/availability'],
    ['get', '/api/bookings'],
    ['post', '/api/bookings'],
    ['delete', '/api/bookings/1'],
    ['get', '/api/updateRole'],
    ['patch', '/api/updateRole/1'],
  ])('%s %s', async (method, url) => {
    const res = await request(app)[method](url).send({});
    expect(res.status).toBe(401);
  });
});

describe('resources: who can create / edit / delete', () => {
  const body = { name: 'Something', description: 'x', capacity: 1, duration_minutes: 30, is_active: true };

  it('customer cannot create, edit or delete (403)', async () => {
    expect((await as('customer')(request(app).post('/api/resources')).send(body)).status).toBe(403);
    expect((await as('customer')(request(app).put('/api/resources/1')).send(body)).status).toBe(403);
    expect((await as('customer')(request(app).delete('/api/resources/1'))).status).toBe(403);
  });

  it('provider cannot edit or delete another provider\'s resource (403)', async () => {
    // resource 3 belongs to provider2 (11)
    expect((await as('provider')(request(app).put('/api/resources/3')).send(body)).status).toBe(403);
    expect((await as('provider')(request(app).delete('/api/resources/3'))).status).toBe(403);
    const [[row]] = await db.query('SELECT name, is_active FROM resources WHERE id = 3');
    expect(row).toMatchObject({ name: 'Haircut', is_active: 1 });
  });

  it('provider can edit and delete their own', async () => {
    expect((await as('provider')(request(app).put('/api/resources/2')).send(body)).status).toBe(200);
    expect((await as('provider')(request(app).delete('/api/resources/2'))).status).toBe(200);
  });

  it('admin can edit and delete any', async () => {
    expect((await as('admin')(request(app).put('/api/resources/4')).send(body)).status).toBe(200);
    expect((await as('admin')(request(app).delete('/api/resources/4'))).status).toBe(200);
  });
});

describe('availability: who can define it', () => {
  const slot = (resource_id) => ({ resource_id, specific_date: '2030-02-01', start_time: '08:00', end_time: '12:00' });

  it('every role can read availability', async () => {
    for (const role of ['customer', 'provider', 'admin']) {
      expect((await as(role)(request(app).get('/api/availability?resource_id=1'))).status).toBe(200);
    }
  });

  it('?resource_id filters the list', async () => {
    const res = await as('customer')(request(app).get('/api/availability?resource_id=1'));
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((a) => a.resource_id === 1)).toBe(true);
  });

  it('customer cannot create (403)', async () => {
    expect((await as('customer')(request(app).post('/api/availability')).send(slot(1))).status).toBe(403);
  });

  it('provider can add availability to their own resource only', async () => {
    expect((await as('provider')(request(app).post('/api/availability')).send(slot(1))).status).toBe(201);
    expect((await as('provider')(request(app).post('/api/availability')).send(slot(3))).status).toBe(403);
  });

  it('admin can add availability to any resource', async () => {
    expect((await as('admin')(request(app).post('/api/availability')).send(slot(3))).status).toBe(201);
  });

  it('404 for a resource that does not exist', async () => {
    expect((await as('provider')(request(app).post('/api/availability')).send(slot(9999))).status).toBe(404);
  });

  it('end_time must be after start_time (422, names the field)', async () => {
    const res = await as('provider')(request(app).post('/api/availability'))
      .send({ ...slot(1), start_time: '12:00', end_time: '08:00' });
    expect(res.status).toBe(422);
    expect(res.body.errors.map((e) => e.field)).toContain('end_time');
  });

  it('update / delete: customer 403, other provider 403, owner OK', async () => {
    const [[a]] = await db.query('SELECT id FROM availability WHERE resource_id = 3 LIMIT 1');
    const edit = { resource_id: 3, specific_date: '2030-02-02', start_time: '10:00', end_time: '11:00' };
    expect((await as('customer')(request(app).put(`/api/availability/${a.id}`)).send(edit)).status).toBe(403);
    expect((await as('provider')(request(app).put(`/api/availability/${a.id}`)).send(edit)).status).toBe(403);
    expect((await as('provider')(request(app).delete(`/api/availability/${a.id}`))).status).toBe(403);
    expect((await as('provider2')(request(app).put(`/api/availability/${a.id}`)).send(edit)).status).toBe(200);
    expect((await as('provider2')(request(app).delete(`/api/availability/${a.id}`))).status).toBe(200);
    const [rows] = await db.query('SELECT id FROM availability WHERE id = ?', [a.id]);
    expect(rows).toHaveLength(0);
  });
});

describe('bookings: who can see and cancel what', () => {
  let b1, b2; // b1: customer on resource 1 (provider's), b2: customer2 on resource 5 (provider's too)
  let bOther; // customer on resource 3 (provider2's)

  beforeAll(async () => {
    await resetDatabase();      // pichle describe ne availability badli/delete ki thi: saaf seed se shuru
    b1 = (await makeBooking('customer', 1, '09:00', '10:00')).body;
    b2 = (await makeBooking('customer2', 5, '09:00', '10:00')).body;
    bOther = (await makeBooking('customer', 3, '09:00', '10:00')).body;
  });

  it('customer sees only their own bookings', async () => {
    const res = await as('customer')(request(app).get('/api/bookings'));
    expect(res.status).toBe(200);
    expect(res.body.map((b) => b.id).sort()).toEqual([b1.id, bOther.id].sort());
  });

  it('provider sees bookings on their own resources, with the correct booking ids', async () => {
    const res = await as('provider')(request(app).get('/api/bookings'));
    expect(res.status).toBe(200);
    expect(res.body.map((b) => b.id).sort()).toEqual([b1.id, b2.id].sort());   // not bOther (resource 3)
    expect(res.body.every((b) => b.status === 'confirmed' && b.specific_date)).toBe(true);
  });

  it('the other provider sees only their resource\'s bookings', async () => {
    const res = await as('provider2')(request(app).get('/api/bookings'));
    expect(res.body.map((b) => b.id)).toEqual([bOther.id]);
  });

  it('admin sees every booking', async () => {
    const res = await as('admin')(request(app).get('/api/bookings'));
    expect(res.body).toHaveLength(3);
  });

  it('GET /bookings/:id: owner, resource provider and admin yes; others 403', async () => {
    const get = (role) => as(role)(request(app).get(`/api/bookings/${b1.id}`));
    expect((await get('customer')).status).toBe(200);
    expect((await get('provider')).status).toBe(200);
    expect((await get('admin')).status).toBe(200);
    expect((await get('customer2')).status).toBe(403);
    expect((await get('provider2')).status).toBe(403);
  });

  it('GET /bookings/:id does not leak the owner_id of the resource', async () => {
    const res = await as('customer')(request(app).get(`/api/bookings/${b1.id}`));
    expect(res.body).not.toHaveProperty('owner_id');
  });

  it('a customer cannot edit someone else\'s booking (403)', async () => {
    const res = await as('customer2')(request(app).put(`/api/bookings/${b1.id}`)).send({
      resource_id: 1, specific_date: DAY1, start_time: '12:00', end_time: '13:00',
    });
    expect(res.status).toBe(403);
  });

  it('cancel: stranger 403, other provider 403', async () => {
    expect((await as('customer2')(request(app).delete(`/api/bookings/${b1.id}`))).status).toBe(403);
    expect((await as('provider2')(request(app).delete(`/api/bookings/${b1.id}`))).status).toBe(403);
    const [[row]] = await db.query('SELECT status FROM bookings WHERE id = ?', [b1.id]);
    expect(row.status).toBe('confirmed');
  });

  it('cancel: the resource\'s provider can cancel (FR-17)', async () => {
    expect((await as('provider')(request(app).delete(`/api/bookings/${b2.id}`))).status).toBe(200);
    const [[row]] = await db.query('SELECT status FROM bookings WHERE id = ?', [b2.id]);
    expect(row.status).toBe('cancelled');
  });

  it('cancel: admin can cancel any (FR-18)', async () => {
    expect((await as('admin')(request(app).delete(`/api/bookings/${bOther.id}`))).status).toBe(200);
  });

  it('cancel: the owner can cancel their own', async () => {
    expect((await as('customer')(request(app).delete(`/api/bookings/${b1.id}`))).status).toBe(200);
  });

  it('cancel / get: 404 for a missing booking', async () => {
    expect((await as('admin')(request(app).delete('/api/bookings/99999'))).status).toBe(404);
    expect((await as('admin')(request(app).get('/api/bookings/99999'))).status).toBe(404);
  });
});

describe('users and roles: admin only (FR-4)', () => {
  it('customer and provider get 403', async () => {
    for (const role of ['customer', 'provider']) {
      expect((await as(role)(request(app).get('/api/updateRole'))).status).toBe(403);
      expect((await as(role)(request(app).patch('/api/updateRole/1')).send({ role: 'admin' })).status).toBe(403);
    }
  });

  it('admin lists users and no password_hash is returned (NFR-3)', async () => {
    const res = await as('admin')(request(app).get('/api/updateRole'));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(5);
    expect(res.body.every((u) => !('password_hash' in u) && !('password' in u))).toBe(true);
  });

  it('admin changes a role; the database reflects it', async () => {
    const res = await as('admin')(request(app).patch('/api/updateRole/2')).send({ role: 'provider' });
    expect(res.status).toBe(200);
    const [[row]] = await db.query('SELECT role FROM users WHERE id = 2');
    expect(row.role).toBe('provider');
  });

  it('invalid role -> 400, unknown user -> 404', async () => {
    expect((await as('admin')(request(app).patch('/api/updateRole/2')).send({ role: 'superuser' })).status).toBe(400);
    expect((await as('admin')(request(app).patch('/api/updateRole/9999')).send({ role: 'admin' })).status).toBe(404);
  });
});
