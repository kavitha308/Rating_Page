const storeService = require('../services/storeService');
const { successResponse } = require('../utils/response');

/**
 * Get all stores with aggregated rating and user submitted rating
 */
const getAllStores = async (req, res, next) => {
  try {
    const currentUserId = req.user ? req.user.id : null;
    const { stores, meta } = await storeService.getAllStores(req.query, currentUserId);

    return successResponse(res, {
      statusCode: 200,
      message: 'Stores retrieved successfully.',
      data: { stores },
      meta
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single store details by ID
 */
const getStoreById = async (req, res, next) => {
  try {
    const currentUserId = req.user ? req.user.id : null;
    const store = await storeService.getStoreById(req.params.id, currentUserId);

    return successResponse(res, {
      statusCode: 200,
      message: 'Store details retrieved successfully.',
      data: { store }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStores,
  getStoreById
};
