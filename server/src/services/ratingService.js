const db = require('../config/db');
const AppError = require('../utils/appError');

/**
 * Get current user's submitted rating for a specific store
 */
const getMyRating = async (storeId, userId) => {
  // Check store exists
  const [stores] = await db.query('SELECT id, name FROM stores WHERE id = ?', [storeId]);
  if (stores.length === 0) {
    throw new AppError('Store not found.', 404);
  }

  const [ratings] = await db.query(
    'SELECT id, rating, created_at, updated_at FROM ratings WHERE user_id = ? AND store_id = ?',
    [userId, storeId]
  );

  if (ratings.length === 0) {
    return {
      rated: false,
      rating: null,
      store: stores[0]
    };
  }

  return {
    rated: true,
    rating: ratings[0].rating,
    created_at: ratings[0].created_at,
    updated_at: ratings[0].updated_at,
    store: stores[0]
  };
};

/**
 * Submit a new rating (1-5) for a store. Prevents duplicate ratings.
 */
const submitRating = async (storeId, userId, rating) => {
  // 1. Verify store exists
  const [stores] = await db.query('SELECT id, name FROM stores WHERE id = ?', [storeId]);
  if (stores.length === 0) {
    throw new AppError('Store not found.', 404);
  }

  // 2. Check if user has already rated this store
  const [existing] = await db.query(
    'SELECT id, rating FROM ratings WHERE user_id = ? AND store_id = ?',
    [userId, storeId]
  );

  if (existing.length > 0) {
    throw new AppError(
      'You have already rated this store. Please use the update option to modify your rating.',
      409
    );
  }

  // 3. Insert rating
  await db.query(
    'INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)',
    [userId, storeId, rating]
  );

  // 4. Calculate latest store average
  const [aggregate] = await db.query(
    `SELECT ROUND(COALESCE(AVG(rating), 0), 2) AS overall_rating, COUNT(id) AS total_ratings
     FROM ratings WHERE store_id = ?`,
    [storeId]
  );

  return {
    store_id: parseInt(storeId, 10),
    store_name: stores[0].name,
    user_rating: parseInt(rating, 10),
    overall_rating: parseFloat(aggregate[0].overall_rating) || 0,
    total_ratings: parseInt(aggregate[0].total_ratings, 10) || 0,
    message: 'Rating submitted successfully.'
  };
};

/**
 * Modify an existing rating
 */
const modifyRating = async (storeId, userId, newRating) => {
  // 1. Verify store exists
  const [stores] = await db.query('SELECT id, name FROM stores WHERE id = ?', [storeId]);
  if (stores.length === 0) {
    throw new AppError('Store not found.', 404);
  }

  // 2. Verify previous rating exists
  const [existing] = await db.query(
    'SELECT id, rating FROM ratings WHERE user_id = ? AND store_id = ?',
    [userId, storeId]
  );

  if (existing.length === 0) {
    throw new AppError('No rating found for this store. Please submit an initial rating first.', 404);
  }

  const previousRating = existing[0].rating;

  // 3. Update rating record
  await db.query(
    'UPDATE ratings SET rating = ?, updated_at = NOW() WHERE user_id = ? AND store_id = ?',
    [newRating, userId, storeId]
  );

  // 4. Recalculate updated store average
  const [aggregate] = await db.query(
    `SELECT ROUND(COALESCE(AVG(rating), 0), 2) AS overall_rating, COUNT(id) AS total_ratings
     FROM ratings WHERE store_id = ?`,
    [storeId]
  );

  return {
    store_id: parseInt(storeId, 10),
    store_name: stores[0].name,
    previous_rating: previousRating,
    user_rating: parseInt(newRating, 10),
    overall_rating: parseFloat(aggregate[0].overall_rating) || 0,
    total_ratings: parseInt(aggregate[0].total_ratings, 10) || 0,
    message: 'Rating updated successfully.'
  };
};

module.exports = {
  getMyRating,
  submitRating,
  modifyRating
};
