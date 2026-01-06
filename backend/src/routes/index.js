const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const borrowRoutes = require('./borrowRoutes');
const reportRoutes = require('./reportRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/borrow', borrowRoutes);
router.use('/reports', reportRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
