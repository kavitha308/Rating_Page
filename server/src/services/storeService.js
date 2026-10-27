const db = require('../config/db');
const AppError = require('../utils/appError');
const { parseQueryParams, formatPaginationMeta, escapeLikeString } = require('../utils/pagination');

// Whitelisted sorting columns for store catalog
const ALLOWED_STORE_SORT_FIELDS = ['name', 'address', 'rating', 'overall_rating', 'totalRatings', 'created_at'];

const SORT_FIELD_MAP = {
  name: 's.name',
  address: 's.address',
  rating: 'overall_rating',
  overall_rating: 'overall_rating',
  totalRatings: 'total_ratings',
  created_at: 's.created_at'
};

/**
 * Get all stores with aggregated rating and current user's rating
 */
const getAllStores = async (queryParams, currentUserId = null) => {
  const { page, limit, offset, sortBy, sortOrder, search } = parseQueryParams(
    queryParams,
    ALLOWED_STORE_SORT_FIELDS,
    'name'
  );

  const sqlOrderBy = `${SORT_FIELD_MAP[sortBy]} ${sortOrder}`;

  let whereClause = '';
  const whereParams = [];

  if (search) {
    whereClause = 'WHERE (s.name LIKE ? OR s.address LIKE ?)';
    const searchPattern = `%${escapeLikeString(search)}%`;
    whereParams.push(searchPattern, searchPattern);
  }

  // 1. Count total matching stores
  const countSql = `SELECT COUNT(*) AS total FROM stores s ${whereClause}`;
  const [countResult] = await db.query(countSql, whereParams);
  const total = countResult[0].total;

  // 2. Fetch paginated stores with ratings aggregation
  // If current user is authenticated, query user's submitted rating
  const myRatingSelect = currentUserId
    ? ', (SELECT r_sub.rating FROM ratings r_sub WHERE r_sub.user_id = ? AND r_sub.store_id = s.id LIMIT 1) AS user_submitted_rating'
    : ', NULL AS user_submitted_rating';

  const queryParamsList = [];
  if (currentUserId) {
    queryParamsList.push(currentUserId);
  }
  queryParamsList.push(...whereParams);

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
      ROUND(COALESCE(AVG(r.rating), 0), 2) AS overall_rating,
      COUNT(r.id) AS total_ratings
      ${myRatingSelect}
    FROM stores s
    LEFT JOIN users u ON s.owner_id = u.id
    LEFT JOIN ratings r ON s.id = r.store_id
    ${whereClause}
    GROUP BY s.id, u.name
    ORDER BY ${sqlOrderBy}
    LIMIT ? OFFSET ?
  `;

  queryParamsList.push(limit, offset);

  const [stores] = await db.query(fetchSql, queryParamsList);

  return {
    stores: stores.map((store) => ({
      ...store,
      overall_rating: parseFloat(store.overall_rating) || 0,
      total_ratings: parseInt(store.total_ratings, 10) || 0,
      user_submitted_rating: store.user_submitted_rating !== null ? parseInt(store.user_submitted_rating, 10) : null
    })),
    meta: formatPaginationMeta(total, page, limit)
  };
};

/**
 * Get detailed store profile by ID
 */
const getStoreById = async (storeId, currentUserId = null) => {
  const myRatingSelect = currentUserId
    ? ', (SELECT r_sub.rating FROM ratings r_sub WHERE r_sub.user_id = ? AND r_sub.store_id = s.id LIMIT 1) AS user_submitted_rating'
    : ', NULL AS user_submitted_rating';

  const params = currentUserId ? [currentUserId, storeId] : [storeId];

  const [stores] = await db.query(
    `
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
      ROUND(COALESCE(AVG(r.rating), 0), 2) AS overall_rating,
      COUNT(r.id) AS total_ratings
      ${myRatingSelect}
    FROM stores s
    LEFT JOIN users u ON s.owner_id = u.id
    LEFT JOIN ratings r ON s.id = r.store_id
    WHERE s.id = ?
    GROUP BY s.id, u.name, u.email
  `,
    params
  );

  if (stores.length === 0) {
    throw new AppError('Store not found.', 404);
  }

  const store = stores[0];

  // Fetch rating distribution breakdown (1-5 stars)
  const [distribution] = await db.query(
    `
    SELECT
      rating,
      COUNT(*) AS count
    FROM ratings
    WHERE store_id = ?
    GROUP BY rating
    ORDER BY rating DESC
  `,
    [storeId]
  );

  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distribution.forEach((item) => {
    ratingCounts[item.rating] = parseInt(item.count, 10);
  });

  return {
    ...store,
    overall_rating: parseFloat(store.overall_rating) || 0,
    total_ratings: parseInt(store.total_ratings, 10) || 0,
    user_submitted_rating: store.user_submitted_rating !== null ? parseInt(store.user_submitted_rating, 10) : null,
    rating_distribution: ratingCounts
  };
};

module.exports = {
  getAllStores,
  getStoreById
};
