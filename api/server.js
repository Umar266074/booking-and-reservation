require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const updateRoleRoutes = require('./routes/updateRoleRoutes');
const resourcesRoute = require('./routes/resourcesRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');

const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const corsOptions = {
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  credentials: true,
};

const port = process.env.PORT || 5000;
const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/resources', resourcesRoute);
app.use('/api/bookings', bookingRoutes);
app.use('/api/updateRole', updateRoleRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;

  if (process.env.NODE_ENV === 'production') {
    return res.status(statusCode).json({
      error: 'Internal Server Error',
      message: statusCode === 500 ? 'Something went wrong, please try again later.' : err.message
    });
  }

  console.error(err);
  return res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: err.stack
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;