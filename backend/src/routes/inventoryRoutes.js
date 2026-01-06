const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const inventoryController = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

// Validation rules
const inventoryValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required'),
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required'),
  body('pcType')
    .isIn(['LAPTOP', 'DESKTOP', 'LAPTOP DESKTOP'])
    .withMessage('Invalid PC type')
];

// All routes require authentication
router.use(authenticate);

// Get routes (accessible to all authenticated users)
router.get('/', inventoryController.getAllInventory);
router.get('/statistics', inventoryController.getStatistics);
router.get('/departments', inventoryController.getDepartments);
router.get('/:id', inventoryController.getInventoryById);

// Create/Update/Delete routes (admin and manager only)
router.post('/', authorize('admin', 'manager'), inventoryValidation, validate, inventoryController.createInventory);
router.put('/:id', authorize('admin', 'manager'), inventoryController.updateInventory);
router.delete('/:id', authorize('admin', 'manager'), inventoryController.deleteInventory);

// Bulk import (admin only)
router.post('/bulk-import', authorize('admin'), inventoryController.bulkImport);

module.exports = router;
