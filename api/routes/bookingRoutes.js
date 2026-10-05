const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookingController');
const {bookingValidation, validateBookings} = require('../middlewares/bookingsMiddleware');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

router.get('/', authenticate,requireRole('customer','provider', 'admin'), bookingsController.getAllBookings );
router.get('/:id', authenticate,requireRole('customer','provider', 'admin'), bookingsController.getByIdBookings );
router.post('/', authenticate,requireRole('customer','provider', 'admin') , bookingValidation, validateBookings, bookingsController.postBookings );
router.put('/:id', authenticate,requireRole('customer','provider', 'admin') , bookingValidation, validateBookings, bookingsController.putBookingsById );
router.delete('/:id',authenticate,requireRole('customer','provider', 'admin') , bookingsController.cancelBooking);

module.exports = router;