const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const {authenticate, requireRole} = require('../middlewares/authMiddleware')

router.get('/', authenticate, requireRole('admin'), userController.getAllUsers);
router.get('/:id', authenticate, requireRole('admin'), userController.getUserById);
router.patch('/:id',authenticate, requireRole('admin'), userController.updateUserRole );

module.exports = router;