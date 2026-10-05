process.env.JWT_SECRET = 'test_jwt_secret';
process.env.DOTENV_CONFIG_QUIET = 'true';
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'booking_system_test';

const db = require('../config/db');

beforeAll(async () => {
    await db.query('DELETE FROM bookings');
    await db.query('DELETE FROM availability');
    await db.query('DELETE FROM resources');
    await db.query('DELETE FROM users');

    await db.query(`
        INSERT INTO users (id, name, email, password, role) VALUES 
        (101, 'Test Admin', 'admin@test.com', 'hash123', 'admin'),
        (102, 'Test Provider', 'provider@test.com', 'hash123', 'provider'),
        (103, 'Test Customer', 'customer@test.com', 'hash123', 'customer');
    `);

    await db.query(`
        INSERT INTO resources (id, name, description, capacity, duration_minutes, owner_id, is_active) VALUES 
        (201, 'Conference Room A', 'Test Room', 10, 60, 102, 1);
    `);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    await db.query(`
        INSERT INTO availability (id, resource_id, specific_date, start_time, end_time) VALUES 
        (301, 201, ?, '09:00:00', '17:00:00');
    `, [dateStr]);
});

afterAll(async () => {
    await db.end();
});
