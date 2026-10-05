// Bookings ka core CRUD (list / get / update / cancel). Conflict rules bookings.conflict.test.js mein hain.
const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const { bearer } = require('./helpers');
const { resetDatabase, DAY1, DAY2 } = require('./testDb');

const as = (role) => (req) => req.set('Authorization', bearer(role));
const payload = (o = {}) => ({ resource_id: 1, specific_date: DAY1, start_time: '09:00', end_time: '10:00', ...o });

beforeAll(resetDatabase);
beforeEach(() => db.query('DELETE FROM bookings'));
afterAll(() => db.end());

describe('create + list + get', () => {
  it('a created booking appears in My Bookings and can be fetched by id', async () => {
    const created = await as('customer')(request(app).post('/api/bookings')).send(payload());
    expect(created.status).toBe(201);

    const list = await as('customer')(request(app).get('/api/bookings'));
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ id: created.body.id, resource_id: 1, user_id: 1, status: 'confirmed' });

    const one = await as('customer')(request(app).get(`/api/bookings/${created.body.id}`));
    expect(one.status).toBe(200);
    expect(one.body.id).toBe(created.body.id);
  });

  it('another customer does not see it in their list', async () => {
    await as('customer')(request(app).post('/api/bookings')).send(payload());
    const list = await as('customer2')(request(app).get('/api/bookings'));
    expect(list.body).toEqual([]);
  });
});

describe('update (PUT)', () => {
  it('owner can change the time; admin can too; the change is stored', async () => {
    const b = (await as('customer')(request(app).post('/api/bookings')).send(payload())).body;
    const r1 = await as('customer')(request(app).put(`/api/bookings/${b.id}`))
      .send(payload({ start_time: '11:00', end_time: '12:00' }));
    expect(r1.status).toBe(200);
    const r2 = await as('admin')(request(app).put(`/api/bookings/${b.id}`))
      .send(payload({ specific_date: DAY2, start_time: '13:00', end_time: '14:00' }));
    expect(r2.status).toBe(200);
    const [[row]] = await db.query('SELECT start_time, end_time FROM bookings WHERE id = ?', [b.id]);
    expect(row).toMatchObject({ start_time: '13:00:00', end_time: '14:00:00' });
  });

  it('404 for a missing booking', async () => {
    const res = await as('customer')(request(app).put('/api/bookings/99999')).send(payload());
    expect(res.status).toBe(404);
  });

  it('422 for invalid input', async () => {
    const b = (await as('customer')(request(app).post('/api/bookings')).send(payload())).body;
    const res = await as('customer')(request(app).put(`/api/bookings/${b.id}`))
      .send(payload({ start_time: '12:00', end_time: '11:00' }));
    expect(res.status).toBe(422);
  });
});

describe('cancel (DELETE)', () => {
  it('sets status to cancelled and keeps the row', async () => {
    const b = (await as('customer')(request(app).post('/api/bookings')).send(payload())).body;
    const res = await as('customer')(request(app).delete(`/api/bookings/${b.id}`));
    expect(res.status).toBe(200);
    const list = await as('customer')(request(app).get('/api/bookings'));
    expect(list.body[0].status).toBe('cancelled');
  });
});
