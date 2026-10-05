const express = require('express');
const router = express.Router();
const {register , login} = require('../controllers/authController')

const { registerValidation, validateRegister } = require('../middlewares/authMiddleware');

router.post('/register', registerValidation,validateRegister,register);
router.post('/login', login);

module.exports = router;