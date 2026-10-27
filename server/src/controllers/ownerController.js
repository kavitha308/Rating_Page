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
 * Get list of users who rated owner's store
 */
const getRatings = async (req, res, next) => {
  try {
    const { store, ratings, meta } = await ownerService.getOwnerRatings(req.user.id, req.query);

    return successResponse(res, {
      statusCode: 200,
      message: 'Store ratings retrieved successfully.',
      data: { store, ratings },
      meta
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get owner's assigned store profile
 */
const getStore = async (req, res, next) => {
  try {
    const store = await ownerService.getOwnerStoreProfile(req.user.id);

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
