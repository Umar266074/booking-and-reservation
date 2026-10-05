const { body, validationResult } = require('express-validator');

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const toSeconds = (t) => {
    if (!t) return 0;
    const [h, m, s = 0] = t.split(':').map(Number);
    return h * 3600 + m * 60 + s;
};

const bookingValidation = [
    body('resource_id')
        .exists({ checkFalsy: true }).withMessage('Resource id must be required')
        .isInt({ min: 1 }).withMessage('This must be a positive value and not 0'),

    body('specific_date')
        .notEmpty().withMessage('specific_date is required')
        .isDate({ format: 'YYYY-MM-DD', strictMode: true })
        .withMessage('specific_date must be YYYY-MM-DD'),

    body('start_time')
        .notEmpty().withMessage('start_time is required')
        .matches(TIME_REGEX).withMessage('start_time must be HH:mm or HH:mm:ss'),

    body('end_time')
    .notEmpty().withMessage('End time is required').bail()
    .matches(TIME_REGEX).withMessage('end_time must be HH:mm or HH:mm:ss').bail()
    .custom((value, { req }) => {
        const start = req.body.start_time;
        if (typeof start !== 'string' || !TIME_REGEX.test(start)) return true;

        if (toSeconds(value) <= toSeconds(start)) {
            throw new Error('end_time must be strictly after start_time');
        }
        return true;
    }),

    body('status')
        .optional()
        .isIn(['pending', 'confirmed', 'cancelled'])
        .withMessage('status must be pending, confirmed or cancelled'),

    body('user_id')
        .optional()
        .isInt({ min: 1 }).withMessage('User ID must be a valid positive integer')
];

const validateBookings = (req, res, next) => {
    const allowedFields = ['resource_id', 'user_id', 'specific_date', 'start_time', 'end_time', 'status'];
    const extraFields = Object.keys(req.body).filter(key => !allowedFields.includes(key));

    const errors = validationResult(req);
    const aggregateError = errors.isEmpty()
        ? []
        : errors.array().map(err => ({ field: err.path, message: err.msg }));

    extraFields.forEach(field =>
        aggregateError.push({ field, message: `Unexpected field ${field} not allowed` })
    );

    if (aggregateError.length > 0) {
        return res.status(422).json({ errors: aggregateError });
    }
    next();
};

module.exports = { bookingValidation, validateBookings };