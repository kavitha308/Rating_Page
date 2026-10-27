const ratingService = require('../services/ratingService');
const { successResponse } = require('../utils/response');

/**
 * Get current user's rating for a specific store
 */
const getMyRating = async (req, res, next) => {
  try {
    const storeId = req.params.id;
    const userId = req.user.id;
    const result = await ratingService.getMyRating(storeId, userId);

    return successResponse(res, {
      statusCode: 200,
      message: result.rated
        ? 'Your rating retrieved successfully.'
        : 'You have not rated this store yet.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit a new rating for a store (1-5)
 */
const submitRating = async (req, res, next) => {
  try {
    const storeId = req.params.id;
    const userId = req.user.id;
    const { rating } = req.body;

    const result = await ratingService.submitRating(storeId, userId, rating);

    return successResponse(res, {
      statusCode: 201,
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Modify an existing rating for a store
 */
const modifyRating = async (req, res, next) => {
  try {
    const storeId = req.params.id;
    const userId = req.user.id;
    const { rating } = req.body;

    const result = await ratingService.modifyRating(storeId, userId, rating);

    return successResponse(res, {
      statusCode: 200,
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyRating,
  submitRating,
  modifyRating
};
