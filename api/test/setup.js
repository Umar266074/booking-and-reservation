process.env.JWT_SECRET = 'test_jwt_secret';
process.env.DOTENV_CONFIG_QUIET = 'true';
process.env.NODE_ENV = 'test';
// Tests kabhi apni real database nahi chhoote: hamesha alag *_test database.
// (dotenv already-set variables ko override nahi karta, isliye .env ka DB_NAME yahan haar jata hai)
process.env.DB_NAME = process.env.TEST_DB_NAME || 'booking_system_test';
