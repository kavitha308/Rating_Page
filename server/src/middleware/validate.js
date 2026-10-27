const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

/**
 * Middleware to extract and format validation errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return errorResponse(res, {
      statusCode: 422,
      message: 'Validation failed. Please correct the highlighted errors.',
      errors: formattedErrors
    });
  }
  next();
};

module.exports = validate;
