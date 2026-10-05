const {body, validationResult} = require('express-validator');
const db = require('../config/db');

const resourcesValidation = [
    body('name')
    .exists().withMessage('Name is required')
    .isString().withMessage('Name must be String')
    .isLength({min: 2, max: 150}).withMessage('Name must be the Length of 2-150'),

    body('description')
    .optional()
    .isString().withMessage('Description must be String'),

    body('duration_minutes')
    .optional()
    .isInt({min:1}).withMessage('Time must be positive'),

    body('capacity')
    .optional()
    .isInt({min:1}).withMessage('Capacity must be positive and min 1'),

    body('is_active')
    .optional()
    .isBoolean().withMessage('This Must be Boolean')  
];

const validateResource = (req, res, next)=>{
    const allowedFields = ['name','description', 'capacity' , 'duration_minutes' , 'is_active' ];
    const extraFields = Object.keys(req.body)
    .filter(key => !allowedFields.includes(key));

    const errors = validationResult(req);
    let aggregatError=
    errors.isEmpty() ? [] : errors.array().map(err=>({
        field: err.path,
        message: err.msg
    }))


extraFields.forEach(field => aggregatError.push({
    field, message:`Unexpected error ${field} not allowed`

}))
  if (aggregatError.length > 0) 
    return res.status(422).json({ errors: aggregatError
  });
  next();
}

module.exports = {
    resourcesValidation,
    validateResource,
}