const jwt = require('jsonwebtoken');
const config = require('../config/env');
const db = require('../config/db');
const AppError = require('../utils/appError');
const { ROLES } = require('../constants/roles');

const parseUtcDate = (dateVal) => {
  if (!dateVal) return 0;
  if (dateVal instanceof Date) return dateVal.getTime();
  const str = String(dateVal);
  if (!str.includes('Z') && !/[+-]\d{2}(?::?\d{2})?$/.test(str)) {
    return new Date(str.replace(' ', 'T') + 'Z').getTime();
  }
  return new Date(str).getTime();
};

/**
 * Authentication Middleware
 * Validates JWT Bearer token and verifies user in database
 */
const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in to continue.', 401));
    }

    // Verify token strictly enforcing HS256 algorithm to prevent algorithm confusion attacks
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Your session has expired. Please log in again.', 401));
      }
      return next(new AppError('Invalid authentication token.', 401));
    }

    // Verify user exists in database and has not been deleted
    const [users] = await db.query(
      'SELECT id, name, email, role, address, created_at, updated_at FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return next(new AppError('The user associated with this token no longer exists.', 401));
    }

    const currentUser = users[0];

    // Invalidate tokens issued prior to a password change (stateless session revocation)
    if (decoded.iat && currentUser.updated_at) {
      const tokenIssuedAtMs = decoded.iat * 1000;
      const userUpdatedAtMs = parseUtcDate(currentUser.updated_at);
      // If token was issued before the user record was updated with new password
      if (tokenIssuedAtMs < userUpdatedAtMs - 1000) {
        return next(
          new AppError('Your session has been invalidated due to a recent password change. Please log in again.', 401)
        );
      }
    }

    // Attach verified user to request
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Authentication Middleware
 * Decodes token if present, but does not block unauthenticated requests
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
      const [users] = await db.query(
        'SELECT id, name, email, role, address, created_at, updated_at FROM users WHERE id = ?',
        [decoded.id]
      );
      req.user = users.length > 0 ? users[0] : null;
    } catch (err) {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Role-Based Access Control Middleware
 * @param  {...string} allowedRoles - Allowed user roles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}.`,
          403
        )
      );
    }

    next();
  };
};

// Reusable role guards
const requireAdmin = requireRole(ROLES.ADMIN);
const requireUser = requireRole(ROLES.USER);
const requireStoreOwner = requireRole(ROLES.STORE_OWNER);

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireUser,
  requireStoreOwner
};
