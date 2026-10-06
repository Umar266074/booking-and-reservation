const jwt = require('jsonwebtoken');
const {body ,validationResult} = require('express-validator');

const registerValidation=[
    body('name')
        .trim().notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

    body('email')
        .isEmail().withMessage('Valid email is required')
        .isLength({ max: 100 }).withMessage('Email must be at most 100 characters'),

    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

];
const loginValidation = [
    body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email is required'),

    body('password')
    .notEmpty().withMessage('Password is required')
    .length({min:8, max:20}).withMessage('Password Must be 8 - 20 characters'),

];

const validateRegister = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }

    next();
};

const authenticate = (req, res, next)=>{
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer')){
        return res.status(401).json({message:'Access Token is missing'})
    };
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({message:'Invalid or Expired Token'});
    };
};

const requireRole = (...allowedRoles)=>{
    return (req, res, next)=>{
        if(!req.user || !allowedRoles.includes(req.user.role)){
          return res.status(403).json({message:'Access Denied: insufficient permission'});
        }
        next();
    };
};

module.exports = {authenticate , requireRole, registerValidation , validateRegister, loginValidation};