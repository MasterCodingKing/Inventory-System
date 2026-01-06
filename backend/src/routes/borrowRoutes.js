const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const borrowController = require('../controllers/borrowController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

// Validation rules
const borrowValidation = [
  body('inventoryId')
    .notEmpty()
    .withMessage('Inventory item is required'),
  body('borrowerName')
    .trim()
    .notEmpty()
    .withMessage('Borrower name is required'),
  body('expectedReturnDate')
    .notEmpty()
    .isDate()
    .withMessage('Expected return date is required')
];

const returnValidation = [
  body('returnCondition')
    .optional()
    .isIn(['Good', 'Damaged', 'Lost'])
    .withMessage('Invalid return condition')
];

const extendValidation = [
  body('newExpectedReturnDate')
    .notEmpty()
    .isDate()
    .withMessage('New expected return date is required')
];

// All routes require authentication
router.use(authenticate);

// Get routes
router.get('/', borrowController.getAllBorrowRecords);
router.get('/overdue', borrowController.getOverdueItems);
router.get('/upcoming', borrowController.getUpcomingReturns);
router.get('/statistics', borrowController.getBorrowStatistics);
router.get('/:id', borrowController.getBorrowRecordById);

// Create/Update routes (admin and manager only)
router.post('/', authorize('admin', 'manager'), borrowValidation, validate, borrowController.createBorrowRecord);
router.put('/:id/return', authorize('admin', 'manager'), returnValidation, validate, borrowController.processReturn);
router.put('/:id/extend', authorize('admin', 'manager'), extendValidation, validate, borrowController.extendBorrowPeriod);

// Send reminders (admin only)
router.post('/send-reminders', authorize('admin'), borrowController.sendReturnReminders);

// Delete (admin only)
router.delete('/:id', authorize('admin'), borrowController.deleteBorrowRecord);

module.exports = router;
