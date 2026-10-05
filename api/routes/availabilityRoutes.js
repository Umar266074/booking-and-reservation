const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');
const {availabilitiesValidation, validateavailabilities} = require('../middlewares/availabilityMiddleware');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

router.get('/', authenticate,requireRole('customer','provider','admin'), availabilityController.getAllAvailability );
router.get('/:id', authenticate,requireRole('customer','provider','admin'), availabilityController.getByIdAvailability );
router.post('/', authenticate,requireRole('provider', 'admin') , availabilitiesValidation, validateavailabilities, availabilityController.postAvailability );
router.put('/:id', authenticate,requireRole('provider', 'admin') , availabilitiesValidation, validateavailabilities, availabilityController.putAvailabilityById );
router.delete('/:id',authenticate,requireRole( 'provider','admin') , availabilityController.deleteAvailability );

module.exports = router;