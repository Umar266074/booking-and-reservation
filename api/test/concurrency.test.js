const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 103, role: 'customer' }, process.env.JWT_SECRET || 'secret');
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const testDate = tomorrow.toISOString().split('T')[0];

test('Simultaneous 3 parallel requests for same slot -> Only 1 succeeds', async () => {
    const payload = {
        resource_id: 201,
        specific_date: testDate,
        start_time: '14:00:00',
        end_time: '15:00:00'
    };

    const reqs = [
        request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send(payload),
        request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send(payload),
        request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send(payload)
    ];

    const results = await Promise.all(reqs);
    const statuses = results.map(r => r.statusCode);

    const successCount = statuses.filter(s => s === 201).length;
    const conflictCount = statuses.filter(s => s === 409).length;

    expect(successCount).toBe(1);
    expect(conflictCount).toBe(2);
});