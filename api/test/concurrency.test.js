// NFR-6: parallel requests ke bawajood double-booking nahi honi chahiye.
// Resource row par FOR UPDATE lock ki wajah se requests ek ek karke chalti hain.
const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const { bearer } = require('./helpers');
const { resetDatabase, DAY1 } = require('./testDb');

const book = (role, resource_id, start, end) =>
  request(app)
    .post('/api/bookings')
    .set('Authorization', bearer(role))
    .send({ resource_id, specific_date: DAY1, start_time: start, end_time: end });

const countStatuses = (responses) =>
  responses.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});

// Koi do non-cancelled bookings ek hi resource/date par overlap nahi karni chahiye.
const findOverlaps = async () => {
  const [rows] = await db.query(
    `SELECT a.id AS a_id, b.id AS b_id FROM bookings a
       JOIN bookings b ON a.id < b.id AND a.resource_id = b.resource_id AND a.specific_date = b.specific_date
        AND a.start_time < b.end_time AND a.end_time > b.start_time
      WHERE a.status != 'cancelled' AND b.status != 'cancelled'`
  );
  return rows;
};

beforeAll(resetDatabase);
beforeEach(() => db.query('DELETE FROM bookings'));
afterAll(() => db.end());

describe('concurrent booking attempts', () => {
  it('3 identical requests at once: exactly 1 succeeds, 2 are rejected', async () => {
    const responses = await Promise.all([
      book('customer', 1, '09:00', '10:00'),
      book('customer2', 1, '09:00', '10:00'),
      book('customer', 1, '09:00', '10:00'),
    ]);
    expect(countStatuses(responses)).toEqual({ 201: 1, 409: 2 });
  });

  it('10 identical requests at once: exactly 1 succeeds', async () => {
    const responses = await Promise.all(
      Array.from({ length: 10 }, (_, i) => book(i % 2 ? 'customer' : 'customer2', 2, '14:00', '15:00'))
    );
    expect(countStatuses(responses)).toEqual({ 201: 1, 409: 9 });
    const [[{ n }]] = await db.query("SELECT COUNT(*) AS n FROM bookings WHERE resource_id = 2");
    expect(n).toBe(1);
  });

  it('overlapping-but-different windows at once: never two overlapping bookings', async () => {
    const windows = [
      ['09:00', '10:00'], ['09:30', '10:30'], ['10:00', '11:00'], ['10:30', '11:30'],
      ['09:15', '09:45'], ['10:45', '11:15'], ['09:00', '11:30'], ['10:00', '10:30'],
    ];
    const responses = await Promise.all(windows.map(([s, e], i) => book(i % 2 ? 'customer' : 'customer2', 3, s, e)));
    expect(responses.some((r) => r.status === 201)).toBe(true);
    expect(responses.every((r) => [201, 409].includes(r.status))).toBe(true);
    expect(await findOverlaps()).toEqual([]);
  });

  it('non-overlapping windows at once all succeed (the lock does not reject valid bookings)', async () => {
    const hours = [9, 10, 11, 12, 13];
    const responses = await Promise.all(
      hours.map((h) => book('customer', 4, `${String(h).padStart(2, '0')}:00`, `${String(h + 1).padStart(2, '0')}:00`))
    );
    expect(countStatuses(responses)).toEqual({ 201: 5 });
  });

  it('same time on 5 different resources at once: all 5 succeed', async () => {
    const responses = await Promise.all([1, 2, 3, 4, 5].map((rid) => book('customer', rid, '09:00', '10:00')));
    expect(countStatuses(responses)).toEqual({ 201: 5 });
  });
});
