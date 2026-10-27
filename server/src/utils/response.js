/**
 * Formats standard success response
 */
const successResponse = (res, { statusCode = 200, message = 'Success', data = null, meta = null }) => {
  const payload = {
    success: true,
    message
  };

  if (data !== null) {
    payload.data = data;
  }

  if (meta !== null) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

/**
 * Formats standard error response
 */
const errorResponse = (res, { statusCode = 500, message = 'Internal server error', errors = [] }) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

module.exports = {
  successResponse,
  errorResponse
};
