process.env.JWT_SECRET = 'test_jwt_secret';
process.env.DOTENV_CONFIG_QUIET = 'true';
process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'booking_system_test';
