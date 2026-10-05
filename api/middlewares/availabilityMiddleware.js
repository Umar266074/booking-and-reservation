const {body , validationResult} = require('express-validator');
const db = require('../config/db');

const toSeconds = (t) => {
    if (!t) return 0;
    const [h, m, s = 0] = t.split(':').map(Number);
    return h * 3600 + m * 60 + s;
};

const availabilitiesValidation =[
    body('resource_id')
    .exists().withMessage('Resource id must be required')
    .isInt({min:1}).withMessage('This must be a postive value and not 0'),

    body('start_time')
    .trim()
    .notEmpty().withMessage('start_time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .withMessage('start_time must be in HH:MM or HH:MM:SS format'),
    
    body('end_time')
    .notEmpty().withMessage('End time is required')
        .custom((value, { req }) => {
            if (toSeconds(value) <= toSeconds(req.body.start_time)) {
                throw new Error('end_time must be strictly after start_time');
            }
            return true;
        }),
    
    body('specific_date')
        .optional({ values: 'null' })
        .isDate({ format: 'YYYY-MM-DD', strictMode: true }).withMessage('specific_date must be YYYY-MM-DD'),

    body('day_of_week')
    .optional()
    .isInt({min: 0 , max: 6}).withMessage('Day must be an integer between 0 and 6')
]
const validateavailabilities = (req, res, next)=>{
    const allowedFields = ['resource_id',
        'day_of_week',
        'specific_date',
        'start_time',
        'end_time' ];
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

module.exports= {
    availabilitiesValidation,
    validateavailabilities,
}