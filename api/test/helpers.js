const jwt = require('jsonwebtoken');

const users = {
  customer: { id: 1, email: 'customer@test.com', role: 'customer' },
  provider: { id: 10, email: 'provider@test.com', role: 'provider' },
  admin: { id: 99, email: 'admin@test.com', role: 'admin' },
};

const tokenFor = (role, options = {}) =>
  jwt.sign(users[role], process.env.JWT_SECRET, { expiresIn: '1h', ...options });

const bearer = (role, options) => `Bearer ${tokenFor(role, options)}`;

module.exports = { users, tokenFor, bearer };
