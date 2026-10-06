const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const { bearer } = require('./helpers');
const { resetDatabase, DAY1, DAY2 } = require('./testDb');

const book = (role, { resource_id = 1, date = DAY1, start, end, ...extra } = {}) =>
  request(app)
    .post('/api/bookings')
    .set('Authorization', bearer(role))
    .send({ resource_id, specific_date: date, start_time: start, end_time: end, ...extra });

beforeAll(resetDatabase);
beforeEach(() => db.query('DELETE FROM bookings'));
afterAll(() => db.end());

describe('creating a booking', () => {
  it('books a free slot inside availability (201, confirmed)', async () => {
    const res = await book('customer', { start: '09:00', end: '10:00' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ resource_id: 1, user_id: 1, status: 'confirmed' });
  });

  it('takes user_id from the token, never from the body', async () => {
    const res = await book('customer', { start: '09:00', end: '10:00', user_id: 99 });
    expect(res.status).toBe(201);
    expect(res.body.user_id).toBe(1);
    const [[row]] = await db.query('SELECT user_id FROM bookings WHERE id = ?', [res.body.id]);
    expect(row.user_id).toBe(1);
  });

  it('accepts HH:mm:ss times as well as HH:mm', async () => {
    const res = await book('customer', { start: '09:00:00', end: '10:00:00' });
    expect(res.status).toBe(201);
  });

  it('404 for a resource that does not exist', async () => {
    const res = await book('customer', { resource_id: 9999, start: '09:00', end: '10:00' });
    expect(res.status).toBe(404);
  });
});

describe('overlap detection (FR-11)', () => {
  beforeEach(async () => {
    const res = await book('customer', { start: '10:00', end: '11:00' });
    expect(res.status).toBe(201);
  });

  const overlapping = [
    ['identical slot', '10:00', '11:00'],
    ['inside the existing one', '10:15', '10:45'],
    ['containing the existing one', '09:00', '12:00'],
    ['overlapping the start', '09:30', '10:30'],
    ['overlapping the end', '10:30', '11:30'],
    ['starting 1 minute before it ends', '10:59', '11:30'],
    ['ending 1 minute after it starts', '09:30', '10:01'],
  ];

  it.each(overlapping)('rejects a slot %s with 409', async (_name, start, end) => {
    const res = await book('customer2', { start, end });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already booked/i);
  });

  it('does not create a row for a rejected booking', async () => {
    await book('customer2', { start: '10:30', end: '11:30' });
    const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM bookings');
    expect(n).toBe(1);
  });

  it('blocks even the same user from double-booking themselves', async () => {
    const res = await book('customer', { start: '10:30', end: '11:30' });
    expect(res.status).toBe(409);
  });
});

describe('back-to-back and boundaries (FR-12)', () => {
  it('allows a booking that starts exactly when another ends', async () => {
    expect((await book('customer', { start: '10:00', end: '11:00' })).status).toBe(201);
    expect((await book('customer2', { start: '11:00', end: '12:00' })).status).toBe(201);
  });

  it('allows a booking that ends exactly when another starts', async () => {
    expect((await book('customer', { start: '10:00', end: '11:00' })).status).toBe(201);
    expect((await book('customer2', { start: '09:00', end: '10:00' })).status).toBe(201);
  });

  it('allows a chain of touching bookings filling the whole day', async () => {
    const hours = [9, 10, 11, 12, 13, 14, 15, 16];
    for (const h of hours) {
      const res = await book('customer', { start: `${String(h).padStart(2, '0')}:00`, end: `${String(h + 1).padStart(2, '0')}:00` });
      expect(res.status).toBe(201);
    }
  });

  it('allows a booking that exactly fills the availability window', async () => {
    expect((await book('customer', { start: '09:00', end: '17:00' })).status).toBe(201);
  });

  it('still allows the same time on a different resource', async () => {
    expect((await book('customer', { resource_id: 1, start: '10:00', end: '11:00' })).status).toBe(201);
    expect((await book('customer2', { resource_id: 2, start: '10:00', end: '11:00' })).status).toBe(201);
  });

  it('still allows the same time on a different date', async () => {
    expect((await book('customer', { date: DAY1, start: '10:00', end: '11:00' })).status).toBe(201);
    expect((await book('customer2', { date: DAY2, start: '10:00', end: '11:00' })).status).toBe(201);
  });
});

describe('availability check (FR-10)', () => {
  it.each([
    ['starts before the window', '08:00', '09:30'],
    ['ends after the window', '16:30', '17:30'],
    ['completely before the window', '07:00', '08:00'],
    ['completely after the window', '18:00', '19:00'],
  ])('rejects a booking that %s with 409', async (_name, start, end) => {
    const res = await book('customer', { start, end });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/not available/i);
  });

  it('rejects a date that has no availability at all', async () => {
    const res = await book('customer', { date: '2030-03-03', start: '10:00', end: '11:00' });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/not available/i);
  });
});

describe('cancel and re-book (FR-16)', () => {
  it('a cancelled booking frees the slot for someone else', async () => {
    const first = await book('customer', { start: '13:00', end: '14:00' });
    expect(first.status).toBe(201);

    const cancel = await request(app).delete(`/api/bookings/${first.body.id}`).set('Authorization', bearer('customer'));
    expect(cancel.status).toBe(200);

    const [[row]] = await db.query('SELECT status FROM bookings WHERE id = ?', [first.body.id]);
    expect(row.status).toBe('cancelled');

    const again = await book('customer2', { start: '13:00', end: '14:00' });
    expect(again.status).toBe(201);
  });

  it('the same user can re-book the slot they cancelled', async () => {
    const first = await book('customer', { start: '13:00', end: '14:00' });
    await request(app).delete(`/api/bookings/${first.body.id}`).set('Authorization', bearer('customer'));
    const again = await book('customer', { start: '13:00', end: '14:00' });
    expect(again.status).toBe(201);
    expect(again.body.id).not.toBe(first.body.id);
  });

  it('after re-booking, the slot is blocked again', async () => {
    const first = await book('customer', { start: '13:00', end: '14:00' });
    await request(app).delete(`/api/bookings/${first.body.id}`).set('Authorization', bearer('customer'));
    await book('customer', { start: '13:00', end: '14:00' });
    const third = await book('customer2', { start: '13:30', end: '14:30' });
    expect(third.status).toBe(409);
  });
});

describe('validation (FR-20, FR-21): 422 with the failing fields', () => {
  const fieldsOf = (res) => res.body.errors.map((e) => e.field);

  it('end_time before start_time', async () => {
    const res = await book('customer', { start: '11:00', end: '10:00' });
    expect(res.status).toBe(422);
    expect(fieldsOf(res)).toContain('end_time');
  });

  it('end_time equal to start_time (zero length)', async () => {
    const res = await book('customer', { start: '10:00', end: '10:00' });
    expect(res.status).toBe(422);
    expect(fieldsOf(res)).toContain('end_time');
  });

  it('missing everything lists every missing field', async () => {
    const res = await request(app).post('/api/bookings').set('Authorization', bearer('customer')).send({});
    expect(res.status).toBe(422);
    expect(fieldsOf(res)).toEqual(expect.arrayContaining(['resource_id', 'specific_date', 'start_time', 'end_time']));
  });

  it.each([
    ['start_time is not a time', { start: 'abc', end: '10:00' }, 'start_time'],
    ['end_time is not a time', { start: '09:00', end: '25:00' }, 'end_time'],
    ['date is not a date', { date: '2030-13-45', start: '09:00', end: '10:00' }, 'specific_date'],
    ['date has the wrong format', { date: '15/01/2030', start: '09:00', end: '10:00' }, 'specific_date'],
    ['resource_id is not a number', { resource_id: 'abc', start: '09:00', end: '10:00' }, 'resource_id'],
    ['resource_id is zero', { resource_id: 0, start: '09:00', end: '10:00' }, 'resource_id'],
  ])('%s', async (_name, input, field) => {
    const res = await book('customer', input);
    expect(res.status).toBe(422);
    expect(fieldsOf(res)).toContain(field);
  });

  it('rejects unknown fields', async () => {
    const res = await book('customer', { start: '09:00', end: '10:00', hack: 'x' });
    expect(res.status).toBe(422);
    expect(fieldsOf(res)).toContain('hack');
  });

  it('does not store anything when validation fails', async () => {
    await book('customer', { start: '11:00', end: '10:00' });
    const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM bookings');
    expect(n).toBe(0);
  });
});

describe('editing a booking keeps the same rules (PUT)', () => {
  const edit = (role, id, { resource_id = 1, date = DAY1, start, end }) =>
    request(app)
      .put(`/api/bookings/${id}`)
      .set('Authorization', bearer(role))
      .send({ resource_id, specific_date: date, start_time: start, end_time: end });

  it('can move a booking to a free slot', async () => {
    const b = await book('customer', { start: '09:00', end: '10:00' });
    expect((await edit('customer', b.body.id, { start: '12:00', end: '13:00' })).status).toBe(200);
  });

  it('can keep its own slot (it does not conflict with itself)', async () => {
    const b = await book('customer', { start: '09:00', end: '10:00' });
    expect((await edit('customer', b.body.id, { start: '09:00', end: '10:00' })).status).toBe(200);
  });

  it('cannot be moved onto someone else\'s booking (409)', async () => {
    await book('customer2', { start: '12:00', end: '13:00' });
    const b = await book('customer', { start: '09:00', end: '10:00' });
    expect((await edit('customer', b.body.id, { start: '12:30', end: '13:30' })).status).toBe(409);
  });

  it('can be moved to the slot right next to someone else\'s (back-to-back)', async () => {
    await book('customer2', { start: '12:00', end: '13:00' });
    const b = await book('customer', { start: '09:00', end: '10:00' });
    expect((await edit('customer', b.body.id, { start: '13:00', end: '14:00' })).status).toBe(200);
  });

  it('cannot be moved outside availability (409)', async () => {
    const b = await book('customer', { start: '09:00', end: '10:00' });
    expect((await edit('customer', b.body.id, { start: '17:00', end: '18:00' })).status).toBe(409);
  });
});
