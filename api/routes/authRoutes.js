const express = require('express');
const router = express.Router();
const {register , login} = require('../controllers/authController')

const { registerValidation, validateRegister } = require('../middlewares/authMiddleware');
const {loginValidation} = require('../middlewares/authMiddleware')

router.post('/register', registerValidation,validateRegister,register);
router.post('/login',loginValidation, login);

module.exports = router;