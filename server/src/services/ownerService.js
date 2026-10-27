const db = require('../config/db');
const AppError = require('../utils/appError');
const { parseQueryParams, formatPaginationMeta, escapeLikeString } = require('../utils/pagination');

const ALLOWED_OWNER_RATING_SORTS = ['rating', 'created_at', 'userName', 'userEmail'];
const OWNER_SORT_MAP = {
  rating: 'r.rating',
  created_at: 'r.created_at',
  userName: 'u.name',
  userEmail: 'u.email'
};

/**
 * Helper to fetch store owned by this user
 */
const getStoreForOwner = async (ownerUserId) => {
  const [stores] = await db.query(
    `SELECT s.id, s.name, s.email, s.address, s.created_at, s.updated_at
     FROM stores s
     WHERE s.owner_id = ?`,
    [ownerUserId]
  );

  return stores.length > 0 ? stores[0] : null;
};

/**
 * Get store owner dashboard metrics and summary
 */
const getOwnerDashboard = async (ownerUserId) => {
  const store = await getStoreForOwner(ownerUserId);

  if (!store) {
    return {
      hasAssignedStore: false,
      message: 'No store has been assigned to your store owner account yet. Please contact the administrator.',
      store: null,
      metrics: null
    };
  }

  // Aggregate ratings
  const [aggregates] = await db.query(
    `SELECT
       ROUND(COALESCE(AVG(rating), 0), 2) AS average_rating,
       COUNT(id) AS total_ratings
     FROM ratings
     WHERE store_id = ?`,
    [store.id]
  );

  // Distribution (1-5 stars)
  const [distribution] = await db.query(
    `SELECT rating, COUNT(*) AS count
     FROM ratings
     WHERE store_id = ?
     GROUP BY rating
     ORDER BY rating DESC`,
    [store.id]
  );

  const starBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distribution.forEach((item) => {
    starBreakdown[item.rating] = parseInt(item.count, 10);
  });

  // Recent 5 raters
  const [recentRaters] = await db.query(
    `SELECT
       r.id,
       r.rating,
       r.created_at,
       r.updated_at,
       u.name AS user_name,
       u.email AS user_email
     FROM ratings r
     JOIN users u ON r.user_id = u.id
     WHERE r.store_id = ?
     ORDER BY r.updated_at DESC
     LIMIT 5`,
    [store.id]
  );

  return {
    hasAssignedStore: true,
    store,
    metrics: {
      average_rating: parseFloat(aggregates[0].average_rating) || 0,
      total_ratings: parseInt(aggregates[0].total_ratings, 10) || 0,
      rating_distribution: starBreakdown,
      recent_ratings: recentRaters
    }
  };
};

/**
 * Get paginated list of users who rated this owner's store
 */
const getOwnerRatings = async (ownerUserId, queryParams) => {
  const store = await getStoreForOwner(ownerUserId);

  if (!store) {
    throw new AppError('No store has been assigned to your account yet.', 404);
  }

  const { page, limit, offset, sortBy, sortOrder, search } = parseQueryParams(
    queryParams,
    ALLOWED_OWNER_RATING_SORTS,
    'created_at'
  );

  const sqlOrderBy = `${OWNER_SORT_MAP[sortBy]} ${sortOrder}`;

  let whereClause = 'WHERE r.store_id = ?';
  const whereParams = [store.id];

  if (search) {
    whereClause += ' AND (u.name LIKE ? OR u.email LIKE ?)';
    const searchPattern = `%${escapeLikeString(search)}%`;
    whereParams.push(searchPattern, searchPattern);
  }

  // Count total ratings matching
  const countSql = `
    SELECT COUNT(*) AS total
    FROM ratings r
    JOIN users u ON r.user_id = u.id
    ${whereClause}
  `;
  const [countResult] = await db.query(countSql, whereParams);
  const total = countResult[0].total;

  // Fetch ratings (Do NOT expose sensitive user address or password)
  const fetchSql = `
    SELECT
      r.id,
      r.rating,
      r.created_at,
      r.updated_at,
      u.id AS user_id,
      u.name AS user_name,
      u.email AS user_email
    FROM ratings r
    JOIN users u ON r.user_id = u.id
    ${whereClause}
    ORDER BY ${sqlOrderBy}
    LIMIT ? OFFSET ?
  `;

  const [ratings] = await db.query(fetchSql, [...whereParams, limit, offset]);

  return {
    store: {
      id: store.id,
      name: store.name
    },
    ratings,
    meta: formatPaginationMeta(total, page, limit)
  };
};

/**
 * Get assigned store profile for current store owner
 */
const getOwnerStoreProfile = async (ownerUserId) => {
  const store = await getStoreForOwner(ownerUserId);

  if (!store) {
    throw new AppError('No store is currently assigned to your account.', 404);
  }

  // Fetch average rating
  const [aggregates] = await db.query(
    `SELECT
       ROUND(COALESCE(AVG(rating), 0), 2) AS average_rating,
       COUNT(id) AS total_ratings
     FROM ratings
     WHERE store_id = ?`,
    [store.id]
  );

  return {
    ...store,
    average_rating: parseFloat(aggregates[0].average_rating) || 0,
    total_ratings: parseInt(aggregates[0].total_ratings, 10) || 0
  };
};

module.exports = {
  getOwnerDashboard,
  getOwnerRatings,
  getOwnerStoreProfile
};
