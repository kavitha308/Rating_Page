const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const storeRoutes = require('./storeRoutes');
const ownerRoutes = require('./ownerRoutes');
const adminRoutes = require('./adminRoutes');
const db = require('../config/db');

// Health check endpoint
router.get('/health', async (req, res) => {
  const dbHealth = await db.testConnection();
  return res.status(dbHealth.connected ? 200 : 503).json({
    status: dbHealth.connected ? 'healthy' : 'degraded',
    database: dbHealth,
    timestamp: new Date().toISOString()
  });
});

// Mount domain routes
router.use('/auth', authRoutes);
router.use('/stores', storeRoutes);
router.use('/owner', ownerRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
