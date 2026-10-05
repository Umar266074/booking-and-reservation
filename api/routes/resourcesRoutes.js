const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourcesController');
const {resourcesValidation, validateResource} = require('../middlewares/resourcesMiddleware');
const { requireRole, authenticate } = require('../middlewares/authMiddleware');

router.get('/', authenticate, resourceController.getAllResources );
router.get('/:id', authenticate,requireRole('customer','provider', 'admin'), resourceController.getResourceById );
router.post('/', authenticate,requireRole('provider', 'admin') ,resourcesValidation, validateResource, resourceController.postResources );
router.put('/:id', authenticate,requireRole('provider', 'admin') , resourcesValidation, validateResource, resourceController.putResourcesById );
router.delete('/:id',authenticate,requireRole('provider', 'admin') , resourceController.deleteResourcesById );

module.exports = router;