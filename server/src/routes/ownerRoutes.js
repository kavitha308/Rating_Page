const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const { requireAuth, requireStoreOwner } = require('../middleware/auth');

// All store owner routes require authentication and STORE_OWNER role
router.use(requireAuth, requireStoreOwner);

// GET /api/owner/dashboard (Metrics, avg rating, distribution, recent raters)
router.get('/dashboard', ownerController.getDashboard);

// GET /api/owner/ratings (Paginated, sortable list of users who rated owner's store)
router.get('/ratings', ownerController.getRatings);

// GET /api/owner/store (Owner's primary assigned store profile)
router.get('/store', ownerController.getStore);

// GET /api/owner/store/:storeId (Specific store profile with ownership authorization check)
router.get('/store/:storeId', ownerController.getStore);

module.exports = router;
