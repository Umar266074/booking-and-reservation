const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');

describe('RBAC & Role-Based Access Tests', () => {
    let customerToken, providerToken, adminToken;

    beforeAll(() => {
        const secret = process.env.JWT_SECRET || 'test_secret';
        customerToken = jwt.sign({ id: 1, email: 'cust@test.com', role: 'customer' }, secret, { expiresIn: '1h' });
        providerToken = jwt.sign({ id: 2, email: 'prov@test.com', role: 'provider' }, secret, { expiresIn: '1h' });
        adminToken = jwt.sign({ id: 3, email: 'admin@test.com', role: 'admin' }, secret, { expiresIn: '1h' });
    });

    test('Customer can GET /api/resources (200 OK)', async () => {
        const res = await request(app)
            .get('/api/resources')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(200);
    });

    test('Customer can GET /api/bookings (200 OK)', async () => {
        const res = await request(app)
            .get('/api/bookings')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(200);
    });

    test('Provider can POST /api/resources (201 Created)', async () => {
        const res = await request(app)
            .post('/api/resources')
            .set('Authorization', `Bearer ${providerToken}`)
            .send({
                name: 'Test Resource',
                description: 'Test Description',
                capacity: 1,
                duration_minutes: 30
            });
        expect(res.status).toBe(201);
    });

    test('Admin can GET /api/bookings (200 OK)', async () => {
        const res = await request(app)
            .get('/api/bookings')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
    });
});