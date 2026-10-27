const bcrypt = require('bcryptjs');
const db = require('../config/db');
const AppError = require('../utils/appError');
const { parseQueryParams, formatPaginationMeta, escapeLikeString } = require('../utils/pagination');
const { ROLES } = require('../constants/roles');

// Sorting allowlists
const ALLOWED_USER_SORTS = ['name', 'email', 'role', 'address', 'created_at'];
const USER_SORT_MAP = {
  name: 'u.name',
  email: 'u.email',
  role: 'u.role',
  address: 'u.address',
  created_at: 'u.created_at'
};

const ALLOWED_STORE_SORTS = ['name', 'email', 'address', 'rating', 'totalRatings', 'created_at'];
const STORE_SORT_MAP = {
  name: 's.name',
  email: 's.email',
  address: 's.address',
  rating: 'average_rating',
  totalRatings: 'total_ratings',
  created_at: 's.created_at'
};

const ALLOWED_RATING_SORTS = ['rating', 'created_at', 'userName', 'storeName'];
const RATING_SORT_MAP = {
  rating: 'r.rating',
  created_at: 'r.created_at',
  userName: 'u.name',
  storeName: 's.name'
};

/**
 * 1. Admin Dashboard Statistics
 */
const getDashboardMetrics = async () => {
  // Total users + role breakdown
  const [userCounts] = await db.query(`
    SELECT
      COUNT(*) AS total_users,
      SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) AS total_admins,
      SUM(CASE WHEN role = 'USER' THEN 1 ELSE 0 END) AS total_normal_users,
      SUM(CASE WHEN role = 'STORE_OWNER' THEN 1 ELSE 0 END) AS total_store_owners
    FROM users
  `);

  // Total stores + assigned count
  const [storeCounts] = await db.query(`
    SELECT
      COUNT(*) AS total_stores,
      SUM(CASE WHEN owner_id IS NOT NULL THEN 1 ELSE 0 END) AS total_assigned_stores
    FROM stores
  `);

  // Total ratings + system-wide average
  const [ratingCounts] = await db.query(`
    SELECT
      COUNT(*) AS total_ratings,
      ROUND(COALESCE(AVG(rating), 0), 2) AS system_average_rating
    FROM ratings
  `);

  return {
    users: {
      total: parseInt(userCounts[0].total_users, 10) || 0,
      admins: parseInt(userCounts[0].total_admins, 10) || 0,
      normal_users: parseInt(userCounts[0].total_normal_users, 10) || 0,
      store_owners: parseInt(userCounts[0].total_store_owners, 10) || 0
    },
    stores: {
      total: parseInt(storeCounts[0].total_stores, 10) || 0,
      assigned: parseInt(storeCounts[0].total_assigned_stores, 10) || 0,
      unassigned:
        (parseInt(storeCounts[0].total_stores, 10) || 0) -
        (parseInt(storeCounts[0].total_assigned_stores, 10) || 0)
    },
    ratings: {
      total: parseInt(ratingCounts[0].total_ratings, 10) || 0,
      system_average: parseFloat(ratingCounts[0].system_average_rating) || 0
    }
  };
};

/**
 * 2. Get Users with filtering, search, sorting, and store owner rating display
 */
const getUsers = async (queryParams) => {
  const { page, limit, offset, sortBy, sortOrder, search } = parseQueryParams(
    queryParams,
    ALLOWED_USER_SORTS,
    'created_at'
  );

  const sqlOrderBy = `${USER_SORT_MAP[sortBy]} ${sortOrder}`;

  const whereConditions = [];
  const whereParams = [];

  // Filter by role if requested
  if (queryParams.role && ['ADMIN', 'USER', 'STORE_OWNER'].includes(queryParams.role.toUpperCase())) {
    whereConditions.push('u.role = ?');
    whereParams.push(queryParams.role.toUpperCase());
  }

  // Search by name, email, or address
  if (search) {
    whereConditions.push('(u.name LIKE ? OR u.email LIKE ? OR u.address LIKE ?)');
    const searchPattern = `%${escapeLikeString(search)}%`;
    whereParams.push(searchPattern, searchPattern, searchPattern);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Count total matching
  const [countResult] = await db.query(
    `SELECT COUNT(*) AS total FROM users u ${whereClause}`,
    whereParams
  );
  const total = countResult[0].total;

  // Fetch users; if user is a store owner, include their store name and store rating
  const fetchSql = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.address,
      u.role,
      u.created_at,
      u.updated_at,
      s.id AS store_id,
      s.name AS store_name,
      ROUND(COALESCE(AVG(r.rating), 0), 2) AS store_rating,
      COUNT(r.id) AS store_ratings_count
    FROM users u
    LEFT JOIN stores s ON u.id = s.owner_id
    LEFT JOIN ratings r ON s.id = r.store_id
    ${whereClause}
    GROUP BY u.id, s.id, s.name
    ORDER BY ${sqlOrderBy}
    LIMIT ? OFFSET ?
  `;

  const [users] = await db.query(fetchSql, [...whereParams, limit, offset]);

  return {
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
      store_name: user.store_name || null,
      store_rating: user.store_rating ? parseFloat(user.store_rating) : null,
      store:
        user.role === ROLES.STORE_OWNER && user.store_id
          ? {
              id: user.store_id,
              name: user.store_name,
              average_rating: parseFloat(user.store_rating) || 0,
              total_ratings: parseInt(user.store_ratings_count, 10) || 0
            }
          : null
    })),
    meta: formatPaginationMeta(total, page, limit)
  };
};

/**
 * 3. Get single User Details
 * If user is a store owner, displays store info and store average rating
 */
const getUserById = async (userId) => {
  const [users] = await db.query(
    'SELECT id, name, email, address, role, created_at, updated_at FROM users WHERE id = ?',
    [userId]
  );

  if (users.length === 0) {
    throw new AppError('User not found.', 404);
  }

  const user = users[0];

  // If user is a store owner, fetch detailed store profile and rating
  if (user.role === ROLES.STORE_OWNER) {
    const [stores] = await db.query(
      `
      SELECT
        s.id,
        s.name,
        s.email,
        s.address,
        ROUND(COALESCE(AVG(r.rating), 0), 2) AS average_rating,
        COUNT(r.id) AS total_ratings
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      WHERE s.owner_id = ?
      GROUP BY s.id
    `,
      [userId]
    );

    if (stores.length > 0) {
      user.store = {
        ...stores[0],
        average_rating: parseFloat(stores[0].average_rating) || 0,
        total_ratings: parseInt(stores[0].total_ratings, 10) || 0
      };
    } else {
      user.store = null;
    }
  }

  return user;
};

/**
 * 4. Create User by Admin (Supports ADMIN, USER, STORE_OWNER)
 */
const createUser = async ({ name, email, password, address, role }) => {
  // Check email uniqueness
  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    throw new AppError('An account with this email address already exists.', 409);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const [result] = await db.query(
    'INSERT INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, ?)',
    [name, email, passwordHash, address, role]
  );

  return {
    id: result.insertId,
    name,
    email,
    address,
    role,
    message: 'User created successfully.'
  };
};

/**
 * 5. Get Stores with owner info, aggregated ratings, search, and sorting
 */
const getStores = async (queryParams) => {
  const { page, limit, offset, sortBy, sortOrder, search } = parseQueryParams(
    queryParams,
    ALLOWED_STORE_SORTS,
    'name'
  );

  const sqlOrderBy = `${STORE_SORT_MAP[sortBy]} ${sortOrder}`;

  let whereClause = '';
  const whereParams = [];

  if (search) {
    whereClause = 'WHERE (s.name LIKE ? OR s.address LIKE ? OR s.email LIKE ?)';
    const searchPattern = `%${escapeLikeString(search)}%`;
    whereParams.push(searchPattern, searchPattern, searchPattern);
  }

  // Count total stores
  const [countResult] = await db.query(
    `SELECT COUNT(*) AS total FROM stores s ${whereClause}`,
    whereParams
  );
  const total = countResult[0].total;

  const fetchSql = `
    SELECT
      s.id,
      s.name,
      s.email,
      s.address,
      s.owner_id,
      s.created_at,
      s.updated_at,
      u.name AS owner_name,
      u.email AS owner_email,
      ROUND(COALESCE(AVG(r.rating), 0), 2) AS average_rating,
      COUNT(r.id) AS total_ratings
    FROM stores s
    LEFT JOIN users u ON s.owner_id = u.id
    LEFT JOIN ratings r ON s.id = r.store_id
    ${whereClause}
    GROUP BY s.id, u.name, u.email
    ORDER BY ${sqlOrderBy}
    LIMIT ? OFFSET ?
  `;

  const [stores] = await db.query(fetchSql, [...whereParams, limit, offset]);

  return {
    stores: stores.map((s) => ({
      ...s,
      average_rating: parseFloat(s.average_rating) || 0,
      total_ratings: parseInt(s.total_ratings, 10) || 0
    })),
    meta: formatPaginationMeta(total, page, limit)
  };
};

/**
 * 6. Create Store by Admin (and optionally assign store owner)
 */
const createStore = async ({ name, email, address, ownerId = null }) => {
  // If ownerId provided, validate owner exists, is STORE_OWNER, and not already assigned
  if (ownerId) {
    const [owners] = await db.query('SELECT id, role, name FROM users WHERE id = ?', [ownerId]);
    if (owners.length === 0) {
      throw new AppError('The specified owner user does not exist.', 404);
    }

    if (owners[0].role !== ROLES.STORE_OWNER) {
      throw new AppError(
        `User "${owners[0].name}" is not a STORE_OWNER (Current role: ${owners[0].role}). Only store owners can be assigned to stores.`,
        400
      );
    }

    const [assigned] = await db.query('SELECT id, name FROM stores WHERE owner_id = ?', [ownerId]);
    if (assigned.length > 0) {
      throw new AppError(
        `Store owner "${owners[0].name}" is already assigned to store "${assigned[0].name}". A store owner can only manage one store.`,
        409
      );
    }
  }

  const [result] = await db.query(
    'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
    [name, email, address, ownerId || null]
  );

  return {
    id: result.insertId,
    name,
    email,
    address,
    owner_id: ownerId || null,
    message: 'Store created successfully.'
  };
};

/**
 * 7. Get All Ratings with user and store information
 */
const getRatings = async (queryParams) => {
  const { page, limit, offset, sortBy, sortOrder, search } = parseQueryParams(
    queryParams,
    ALLOWED_RATING_SORTS,
    'created_at'
  );

  const sqlOrderBy = `${RATING_SORT_MAP[sortBy]} ${sortOrder}`;

  let whereClause = '';
  const whereParams = [];

  if (search) {
    whereClause = 'WHERE (u.name LIKE ? OR u.email LIKE ? OR s.name LIKE ?)';
    const searchPattern = `%${escapeLikeString(search)}%`;
    whereParams.push(searchPattern, searchPattern, searchPattern);
  }

  // Count total ratings
  const [countResult] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM ratings r
    JOIN users u ON r.user_id = u.id
    JOIN stores s ON r.store_id = s.id
    ${whereClause}
  `,
    whereParams
  );
  const total = countResult[0].total;

  const fetchSql = `
    SELECT
      r.id,
      r.rating,
      r.created_at,
      r.updated_at,
      u.id AS user_id,
      u.name AS user_name,
      u.email AS user_email,
      s.id AS store_id,
      s.name AS store_name
    FROM ratings r
    JOIN users u ON r.user_id = u.id
    JOIN stores s ON r.store_id = s.id
    ${whereClause}
    ORDER BY ${sqlOrderBy}
    LIMIT ? OFFSET ?
  `;

  const [ratings] = await db.query(fetchSql, [...whereParams, limit, offset]);

  return {
    ratings,
    meta: formatPaginationMeta(total, page, limit)
  };
};

module.exports = {
  getDashboardMetrics,
  getUsers,
  getUserById,
  createUser,
  getStores,
  createStore,
  getRatings
};
