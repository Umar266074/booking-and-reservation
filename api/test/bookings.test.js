const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');

describe('Booking System & Overlap Tests', () => {
    let customerToken;

    beforeAll(() => {
        const secret = process.env.JWT_SECRET || 'test_secret';
        customerToken = jwt.sign({ id: 1, email: 'cust@test.com', role: 'customer' }, secret, { expiresIn: '1h' });
    });

    test('Validation failure 422', async () => {
        const res = await request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                resource_id: '', 
                start_time: 'invalid'
            });

        expect(res.status).toBe(422);
        expect(res.body).toHaveProperty('errors');
    });
});