const adminService = require('../services/adminService');
const { successResponse } = require('../utils/response');

/**
 * Get Admin dashboard metrics
 */
const getDashboard = async (req, res, next) => {
  try {
    const metrics = await adminService.getDashboardMetrics();

    return successResponse(res, {
      statusCode: 200,
      message: 'Admin dashboard metrics retrieved successfully.',
      data: metrics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get users with filtering, sorting, and pagination
 */
const getUsers = async (req, res, next) => {
  try {
    const { users, meta } = await adminService.getUsers(req.query);

    return successResponse(res, {
      statusCode: 200,
      message: 'Users retrieved successfully.',
      data: { users },
      meta
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID with store details if store owner
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await adminService.getUserById(req.params.id);

    return successResponse(res, {
      statusCode: 200,
      message: 'User details retrieved successfully.',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user (ADMIN, USER, or STORE_OWNER)
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, address, role } = req.body;
    const user = await adminService.createUser({ name, email, password, address, role });

    return successResponse(res, {
      statusCode: 201,
      message: user.message,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get stores list for admin
 */
const getStores = async (req, res, next) => {
  try {
    const { stores, meta } = await adminService.getStores(req.query);

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
 * Create store by admin
 */
const createStore = async (req, res, next) => {
  try {
    const { name, email, address, ownerId } = req.body;
    const store = await adminService.createStore({ name, email, address, ownerId });

    return successResponse(res, {
      statusCode: 201,
      message: store.message,
      data: { store }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single store by ID
 */
const getStoreById = async (req, res, next) => {
  try {
    const store = await adminService.getStoreById(req.params.id);

    return successResponse(res, {
      statusCode: 200,
      message: 'Store retrieved successfully.',
      data: { store }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update store by admin
 */
const updateStore = async (req, res, next) => {
  try {
    const { name, email, address, ownerId } = req.body;
    const store = await adminService.updateStore(req.params.id, { name, email, address, ownerId });

    return successResponse(res, {
      statusCode: 200,
      message: store.message,
      data: { store }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all ratings for admin
 */
const getRatings = async (req, res, next) => {
  try {
    const { ratings, meta } = await adminService.getRatings(req.query);

    return successResponse(res, {
      statusCode: 200,
      message: 'Ratings retrieved successfully.',
      data: { ratings },
      meta
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getUsers,
  getUserById,
  createUser,
  getStores,
  getStoreById,
  createStore,
  updateStore,
  getRatings
};
