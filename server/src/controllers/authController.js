const authService = require('../services/authService');
const { successResponse } = require('../utils/response');

/**
 * Register a new Normal User
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, address } = req.body;
    const user = await authService.register({ name, email, password, address });

    return successResponse(res, {
      statusCode: 201,
      message: 'Account registered successfully. You can now log in.',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.login(email, password);

    return successResponse(res, {
      statusCode: 200,
      message: 'Logged in successfully.',
      data: { token, user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);

    return successResponse(res, {
      statusCode: 200,
      message: 'User profile retrieved successfully.',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated user's password
 */
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.updatePassword(req.user.id, currentPassword, newPassword);

    return successResponse(res, {
      statusCode: 200,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updatePassword
};
