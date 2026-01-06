const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

// Validation rules
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
];

const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username or email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Public routes
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], validate, authController.changePassword);

// Admin routes
router.get('/users', authenticate, authorize('admin'), authController.getAllUsers);
router.get('/users/:id', authenticate, authorize('admin'), authController.getUserById);
router.post('/users', authenticate, authorize('admin'), registerValidation, validate, authController.register);
router.put('/users/:id', authenticate, authorize('admin'), authController.updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), authController.deleteUser);

module.exports = router;
