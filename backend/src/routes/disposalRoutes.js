const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const disposalController = require('../controllers/disposalController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

// Validation rules
const disposalValidation = [
  body('inventoryId')
    .notEmpty()
    .withMessage('Inventory item is required')
    .isUUID()
    .withMessage('Invalid inventory ID'),
  body('disposalDate')
    .notEmpty()
    .withMessage('Disposal date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('disposalMethod')
    .notEmpty()
    .withMessage('Disposal method is required')
    .isIn(['Sold', 'Donated', 'Recycled', 'Scrapped', 'Trade-In', 'Other'])
    .withMessage('Invalid disposal method'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason for disposal is required')
];

// All routes require authentication
router.use(authenticate);

// Get routes
router.get('/', disposalController.getAllDisposals);
router.get('/statistics', authorize('admin', 'manager'), disposalController.getStatistics);
router.get('/available-items', disposalController.getAvailableItems);
router.get('/:id', disposalController.getDisposalById);

// Create disposal (admin and manager only)
router.post('/', authorize('admin', 'manager'), disposalValidation, validate, disposalController.createDisposal);

// Update disposal (admin and manager only)
router.put('/:id', authorize('admin', 'manager'), disposalController.updateDisposal);

// Approve disposal (admin only)
router.post('/:id/approve', authorize('admin'), disposalController.approveDisposal);

// Complete disposal (admin and manager only)
router.post('/:id/complete', authorize('admin', 'manager'), disposalController.completeDisposal);

// Cancel disposal (admin only)
router.post('/:id/cancel', authorize('admin'), disposalController.cancelDisposal);

// Delete disposal (admin only)
router.delete('/:id', authorize('admin'), disposalController.deleteDisposal);

module.exports = router;
