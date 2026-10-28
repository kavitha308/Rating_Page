const db = require('../config/db');
const AppError = require('../utils/appError');
const { parseQueryParams, formatPaginationMeta, escapeLikeString } = require('../utils/pagination');

const ALLOWED_OWNER_RATING_SORTS = ['rating', 'created_at', 'userName', 'userEmail', 'storeName'];
const OWNER_SORT_MAP = {
  rating: 'r.rating',
  created_at: 'r.created_at',
  userName: 'u.name',
  userEmail: 'u.email',
  storeName: 's.name'
};

/**
 * Fetch all stores owned by this store owner user
 */
const getStoresForOwner = async (ownerUserId) => {
  const [stores] = await db.query(
    `SELECT s.id, s.name, s.email, s.address, s.created_at, s.updated_at
     FROM stores s
     WHERE s.owner_id = ?
     ORDER BY s.name ASC`,
    [ownerUserId]
  );

  return stores;
};

/**
 * Get store owner dashboard metrics across all managed stores
 */
const getOwnerDashboard = async (ownerUserId) => {
  const stores = await getStoresForOwner(ownerUserId);

  if (stores.length === 0) {
    return {
      hasAssignedStore: false,
      message: 'No stores have been assigned to your store owner account yet. Please contact the administrator.',
      storesCount: 0,
      stores: [],
      store: null,
      metrics: null
    };
  }

  // Calculate individual metrics for each store owned by this user
  const storeMetrics = await Promise.all(
    stores.map(async (store) => {
      const [aggregates] = await db.query(
        `SELECT
           ROUND(COALESCE(AVG(rating), 0), 2) AS average_rating,
           COUNT(id) AS total_ratings
         FROM ratings
         WHERE store_id = ?`,
        [store.id]
      );

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

      return {
        ...store,
        average_rating: parseFloat(aggregates[0].average_rating) || 0,
        total_ratings: parseInt(aggregates[0].total_ratings, 10) || 0,
        rating_distribution: starBreakdown
      };
    })
  );

  // Calculate overall metrics across all assigned stores
  const totalStoreRatings = storeMetrics.reduce((sum, s) => sum + s.total_ratings, 0);
  const overallAverage =
    totalStoreRatings > 0
      ? Number(
          (
            storeMetrics.reduce((sum, s) => sum + s.average_rating * s.total_ratings, 0) /
            totalStoreRatings
          ).toFixed(2)
        )
      : 0;

  // Recent 5 raters across all stores owned by this owner
  const [recentRaters] = await db.query(
    `SELECT
       r.id,
       r.rating,
       r.created_at,
       r.updated_at,
       u.name AS user_name,
       u.email AS user_email,
       s.id AS store_id,
       s.name AS store_name
     FROM ratings r
     JOIN users u ON r.user_id = u.id
     JOIN stores s ON r.store_id = s.id
     WHERE s.owner_id = ?
     ORDER BY r.updated_at DESC
     LIMIT 5`,
    [ownerUserId]
  );

  return {
    hasAssignedStore: true,
    storesCount: stores.length,
    stores: storeMetrics,
    store: storeMetrics[0], // backward compatibility
    metrics: {
      average_rating: overallAverage,
      total_ratings: totalStoreRatings,
      recent_ratings: recentRaters
    }
  };
};

/**
 * Get paginated list of ratings across all stores owned by this user
 */
const getOwnerRatings = async (ownerUserId, queryParams = {}) => {
  const stores = await getStoresForOwner(ownerUserId);

  if (stores.length === 0) {
    return {
      storesCount: 0,
      stores: [],
      store: null,
      ratings: [],
      meta: formatPaginationMeta(0, 1, 10)
    };
  }

  const { page, limit, offset, sortBy, sortOrder, search } = parseQueryParams(
    queryParams,
    ALLOWED_OWNER_RATING_SORTS,
    'created_at'
  );

  const sqlOrderBy = `${OWNER_SORT_MAP[sortBy] || 'r.created_at'} ${sortOrder}`;

  let whereClause = 'WHERE s.owner_id = ?';
  const whereParams = [ownerUserId];

  // Optional: filter ratings to a specific store belonging to this owner
  if (queryParams.storeId) {
    const targetStoreId = Number(queryParams.storeId);
    // Security check: Verify store belongs to owner
    if (!stores.some((s) => s.id === targetStoreId)) {
      throw new AppError('Store not found or unauthorized.', 403);
    }
    whereClause += ' AND r.store_id = ?';
    whereParams.push(targetStoreId);
  }

  if (search) {
    whereClause += ' AND (u.name LIKE ? OR u.email LIKE ? OR s.name LIKE ?)';
    const searchPattern = `%${escapeLikeString(search)}%`;
    whereParams.push(searchPattern, searchPattern, searchPattern);
  }

  // Count total ratings matching
  const countSql = `
    SELECT COUNT(*) AS total
    FROM ratings r
    JOIN users u ON r.user_id = u.id
    JOIN stores s ON r.store_id = s.id
    ${whereClause}
  `;
  const [countResult] = await db.query(countSql, whereParams);
  const total = countResult[0].total;

  // Fetch ratings including store_id and store_name so ratings from multiple stores can be distinguished
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
    storesCount: stores.length,
    stores: stores.map((s) => ({ id: s.id, name: s.name })),
    store: stores[0],
    ratings,
    meta: formatPaginationMeta(total, page, limit)
  };
};

/**
 * Get assigned store profile for current store owner (with ownership security validation)
 */
const getOwnerStoreProfile = async (ownerUserId, storeId = null) => {
  const stores = await getStoresForOwner(ownerUserId);

  if (stores.length === 0) {
    throw new AppError('No store is currently assigned to your account.', 404);
  }

  let targetStore = stores[0];
  if (storeId) {
    targetStore = stores.find((s) => s.id === Number(storeId));
    if (!targetStore) {
      throw new AppError('Store not found or you are not authorized to access this store.', 403);
    }
  }

  // Fetch average rating
  const [aggregates] = await db.query(
    `SELECT
       ROUND(COALESCE(AVG(rating), 0), 2) AS average_rating,
       COUNT(id) AS total_ratings
     FROM ratings
     WHERE store_id = ?`,
    [targetStore.id]
  );

  return {
    ...targetStore,
    average_rating: parseFloat(aggregates[0].average_rating) || 0,
    total_ratings: parseInt(aggregates[0].total_ratings, 10) || 0
  };
};

module.exports = {
  getStoresForOwner,
  getOwnerDashboard,
  getOwnerRatings,
  getOwnerStoreProfile
};
