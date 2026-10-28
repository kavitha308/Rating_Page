const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createUserValidator,
  createStoreValidator,
  updateStoreValidator,
  userIdParamValidator,
  storeIdParamValidator
} = require('../validators/adminValidators');

// All admin routes strictly require authentication and ADMIN role
router.use(requireAuth, requireAdmin);

// GET /api/admin/dashboard (Total users, stores, ratings)
router.get('/dashboard', adminController.getDashboard);

// GET /api/admin/users (List users, filter by role, search, sort, pagination)
router.get('/users', adminController.getUsers);

// GET /api/admin/users/:id (View complete user details + store rating if owner)
router.get(
  '/users/:id',
  userIdParamValidator,
  validate,
  adminController.getUserById
);

// POST /api/admin/users (Create ADMIN, USER, or STORE_OWNER)
router.post(
  '/users',
  createUserValidator,
  validate,
  adminController.createUser
);

// GET /api/admin/stores (List stores, search, sort, pagination)
router.get('/stores', adminController.getStores);

// GET /api/admin/stores/:id (Get single store)
router.get(
  '/stores/:id',
  storeIdParamValidator,
  validate,
  adminController.getStoreById
);

// POST /api/admin/stores (Add store + optional owner assignment)
router.post(
  '/stores',
  createStoreValidator,
  validate,
  adminController.createStore
);

// PUT /api/admin/stores/:id (Update store details + change/reassign owner)
router.put(
  '/stores/:id',
  storeIdParamValidator,
  updateStoreValidator,
  validate,
  adminController.updateStore
);

// GET /api/admin/ratings (List all ratings with user/store info, search, sort, pagination)
router.get('/ratings', adminController.getRatings);

module.exports = router;
