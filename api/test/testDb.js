
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DAY1 = '2030-01-15';
const DAY2 = '2030-01-16';

async function resetDatabase() {
  const name = process.env.DB_NAME;

  if (!/^[A-Za-z0-9_]+_test$/.test(name)) {
    throw new Error(`Refusing to reset "${name}": test database ka naam _test par khatam hona chahiye`);
  }

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true,
  });

  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${name}\``);
    await conn.query(`USE \`${name}\``);
    await conn.query(
      'SET FOREIGN_KEY_CHECKS = 0; DROP TABLE IF EXISTS bookings, availability, resources, users; SET FOREIGN_KEY_CHECKS = 1;'
    );
    await conn.query(fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8'));

    await conn.query(
      `INSERT INTO users (id, name, email, password_hash, role) VALUES
        (1,  'Cathy',  'customer@test.com',  'x', 'customer'),
        (2,  'Carl',   'customer2@test.com', 'x', 'customer'),
        (10, 'Pam',    'provider@test.com',  'x', 'provider'),
        (11, 'Paul',   'provider2@test.com', 'x', 'provider'),
        (99, 'Adam',   'admin@test.com',     'x', 'admin')`
    );

    await conn.query(
      `INSERT INTO resources (id, owner_id, name, description, capacity, duration_minutes, is_active) VALUES
        (1, 10, 'Room A', 'Big room',   4, 30, 1),
        (2, 10, 'Room B', 'Small room', 2, 30, 1),
        (3, 11, 'Haircut', NULL,        1, 45, 1),
        (4, 11, 'Massage', NULL,        1, 60, 1),
        (5, 10, 'Court 1', NULL,       10, 60, 1),
        (6, 10, 'Old Room', NULL,       1, 30, 0)`
    );

    const rows = [];
    for (const rid of [1, 2, 3, 4, 5, 6]) {
      rows.push(`(${rid}, '${DAY1}', '09:00:00', '17:00:00')`);
      rows.push(`(${rid}, '${DAY2}', '09:00:00', '17:00:00')`);
    }
    await conn.query(
      `INSERT INTO availability (resource_id, specific_date, start_time, end_time) VALUES ${rows.join(',')}`
    );
  } finally {
    await conn.end();
  }
}

module.exports = { resetDatabase, DAY1, DAY2 };
