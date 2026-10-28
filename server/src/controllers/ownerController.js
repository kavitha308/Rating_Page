const ownerService = require('../services/ownerService');
const { successResponse } = require('../utils/response');

/**
 * Get store owner dashboard metrics
 */
const getDashboard = async (req, res, next) => {
  try {
    const dashboardData = await ownerService.getOwnerDashboard(req.user.id);

    return successResponse(res, {
      statusCode: 200,
      message: 'Store owner dashboard data retrieved successfully.',
      data: dashboardData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of users who rated owner's stores
 */
const getRatings = async (req, res, next) => {
  try {
    const result = await ownerService.getOwnerRatings(req.user.id, req.query);

    return successResponse(res, {
      statusCode: 200,
      message: 'Store ratings retrieved successfully.',
      data: {
        storesCount: result.storesCount,
        stores: result.stores,
        store: result.store,
        ratings: result.ratings
      },
      meta: result.meta
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get owner's assigned store profile (supports optional storeId parameter with ownership check)
 */
const getStore = async (req, res, next) => {
  try {
    const storeId = req.params.storeId || req.query.storeId || null;
    const store = await ownerService.getOwnerStoreProfile(req.user.id, storeId);

    return successResponse(res, {
      statusCode: 200,
      message: 'Store profile retrieved successfully.',
      data: { store }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getRatings,
  getStore
};
