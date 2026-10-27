const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const config = require('../config/env');
const AppError = require('../utils/appError');
const { ROLES } = require('../constants/roles');

/**
 * Register a new Normal User
 */
const register = async ({ name, email, password, address }) => {
  // Check if email already registered
  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    throw new AppError('An account with this email address already exists.', 409);
  }

  // Hash password with salt cost of 10
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Normal registration strictly assigns the USER role
  const [result] = await db.query(
    'INSERT INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, ?)',
    [name, email, passwordHash, address, ROLES.USER]
  );

  const newUserId = result.insertId;

  return {
    id: newUserId,
    name,
    email,
    address,
    role: ROLES.USER
  };
};

/**
 * Authenticate user and issue JWT
 */
const login = async (email, password) => {
  // Fetch user with hashed password
  const [users] = await db.query(
    'SELECT id, name, email, password_hash, address, role FROM users WHERE email = ?',
    [email]
  );

  if (users.length === 0) {
    throw new AppError('Invalid email or password.', 401);
  }

  const user = users[0];

  // Compare provided password with stored bcrypt hash
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Sign JWT with explicit HS256 algorithm
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
      algorithm: 'HS256'
    }
  );

  let store = null;
  if (user.role === ROLES.STORE_OWNER) {
    const [stores] = await db.query(
      `SELECT s.id, s.name, s.email, s.address,
              ROUND(COALESCE(AVG(r.rating), 0), 2) AS average_rating,
              COUNT(r.id) AS total_ratings
       FROM stores s
       LEFT JOIN ratings r ON s.id = r.store_id
       WHERE s.owner_id = ?
       GROUP BY s.id`,
      [user.id]
    );
    store = stores.length > 0 ? stores[0] : null;
  }

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
      ...(store ? { store } : {})
    }
  };
};

/**
 * Retrieve authenticated user profile with store details if store owner
 */
const getMe = async (userId) => {
  const [users] = await db.query(
    'SELECT id, name, email, address, role, created_at, updated_at FROM users WHERE id = ?',
    [userId]
  );

  if (users.length === 0) {
    throw new AppError('User not found.', 404);
  }

  const user = users[0];

  // If user is a store owner, attach assigned store information
  if (user.role === ROLES.STORE_OWNER) {
    const [stores] = await db.query(
      `SELECT s.id, s.name, s.email, s.address,
              ROUND(COALESCE(AVG(r.rating), 0), 2) AS average_rating,
              COUNT(r.id) AS total_ratings
       FROM stores s
       LEFT JOIN ratings r ON s.id = r.store_id
       WHERE s.owner_id = ?
       GROUP BY s.id`,
      [userId]
    );

    user.store = stores.length > 0 ? stores[0] : null;
  }

  return user;
};

/**
 * Update user account password
 */
const updatePassword = async (userId, currentPassword, newPassword) => {
  const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
  if (users.length === 0) {
    throw new AppError('User not found.', 404);
  }

  const user = users[0];

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    throw new AppError('Current password is incorrect.', 400);
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const newPasswordHash = await bcrypt.hash(newPassword, salt);

  await db.query(
    'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
    [newPasswordHash, userId]
  );

  return { message: 'Password updated successfully.' };
};

module.exports = {
  register,
  login,
  getMe,
  updatePassword
};
