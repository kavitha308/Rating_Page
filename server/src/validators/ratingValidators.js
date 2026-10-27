const { body, param } = require('express-validator');

const ratingValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid store ID'),

  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5')
];

const storeIdParamValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid store ID')
];

module.exports = {
  ratingValidator,
  storeIdParamValidator
};
