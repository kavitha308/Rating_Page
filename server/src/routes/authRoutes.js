const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const {
  registerValidator,
  loginValidator,
  updatePasswordValidator
} = require('../validators/authValidators');

// POST /api/auth/register (Normal User registration)
router.post(
  '/register',
  authLimiter,
  registerValidator,
  validate,
  authController.register
);

// POST /api/auth/login (All roles login)
router.post(
  '/login',
  authLimiter,
  loginValidator,
  validate,
  authController.login
);

// GET /api/auth/me (Current session profile)
router.get(
  '/me',
  requireAuth,
  authController.getMe
);

// PATCH /api/auth/password (Change password)
router.patch(
  '/password',
  requireAuth,
  authLimiter,
  updatePasswordValidator,
  validate,
  authController.updatePassword
);

module.exports = router;
