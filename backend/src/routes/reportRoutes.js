const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Dashboard (all authenticated users)
router.get('/dashboard', reportController.getDashboardSummary);

// Reports (admin and manager only)
router.get('/inventory', authorize('admin', 'manager'), reportController.generateInventoryReport);
router.get('/borrow', authorize('admin', 'manager'), reportController.generateBorrowReport);
router.get('/department', authorize('admin', 'manager'), reportController.generateDepartmentReport);
router.get('/activity', authorize('admin', 'manager'), reportController.generateActivityReport);

module.exports = router;
