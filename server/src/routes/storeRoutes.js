const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const ratingController = require('../controllers/ratingController');
const { requireAuth, optionalAuth, requireUser } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  ratingValidator,
  storeIdParamValidator
} = require('../validators/ratingValidators');

// GET /api/stores (Browse stores, search, sort, filter, pagination)
router.get(
  '/',
  optionalAuth,
  storeController.getAllStores
);

// GET /api/stores/:id (Store detail profile)
router.get(
  '/:id',
  optionalAuth,
  storeIdParamValidator,
  validate,
  storeController.getStoreById
);

// GET /api/stores/:id/my-rating (Get user's rating for this store)
router.get(
  '/:id/my-rating',
  requireAuth,
  storeIdParamValidator,
  validate,
  ratingController.getMyRating
);

// POST /api/stores/:id/rating (Submit new rating 1-5; prevents duplicates)
router.post(
  '/:id/rating',
  requireAuth,
  requireUser,
  ratingValidator,
  validate,
  ratingController.submitRating
);

// PUT /api/stores/:id/rating (Modify existing rating)
router.put(
  '/:id/rating',
  requireAuth,
  requireUser,
  ratingValidator,
  validate,
  ratingController.modifyRating
);

module.exports = router;
