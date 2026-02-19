const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Validation rules
const userCreateValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['admin', 'investor'])
    .withMessage('Role must be either admin or investor')
];

const userUpdateValidation = [
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
];

const sharePriceValidation = [
  body('share_name')
    .trim()
    .notEmpty()
    .withMessage('Share name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Share name must be between 1 and 50 characters'),
  body('current_price')
    .notEmpty()
    .withMessage('Current price is required')
    .isFloat({ min: 0 })
    .withMessage('Current price must be a positive number')
];

const sharePriceUpdateValidation = [
  body('current_price')
    .notEmpty()
    .withMessage('Current price is required')
    .isFloat({ min: 0 })
    .withMessage('Current price must be a positive number')
];

const holdingValidation = [
  body('user_id')
    .notEmpty()
    .withMessage('User ID is required')
    .isInt()
    .withMessage('User ID must be an integer'),
  body('company_name')
    .trim()
    .notEmpty()
    .withMessage('Company name is required'),
  body('firm_name')
    .trim()
    .notEmpty()
    .withMessage('Firm name is required'),
  body('share_name')
    .trim()
    .notEmpty()
    .withMessage('Share name is required'),
  body('share_quantity')
    .notEmpty()
    .withMessage('Share quantity is required')
    .isInt({ min: 1 })
    .withMessage('Share quantity must be at least 1'),
  body('buy_price')
    .notEmpty()
    .withMessage('Buy price is required')
    .isFloat({ min: 0.01 })
    .withMessage('Buy price must be a positive number')
];

const holdingUpdateValidation = [
  body('share_quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Share quantity must be at least 1'),
  body('buy_price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Buy price must be a positive number')
];

// User management routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', userCreateValidation, adminController.createUser);
router.put('/users/:id', userUpdateValidation, adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Share price management routes
router.get('/share-prices', adminController.getAllSharePrices);
router.post('/share-prices', sharePriceValidation, adminController.createSharePrice);
router.put('/share-prices/:id', sharePriceUpdateValidation, adminController.updateSharePrice);
router.delete('/share-prices/:id', adminController.deleteSharePrice);

// Holdings management routes
router.get('/holdings', adminController.getAllHoldings);
router.post('/holdings', holdingValidation, adminController.createHolding);
router.put('/holdings/:id', holdingUpdateValidation, adminController.updateHolding);
router.delete('/holdings/:id', adminController.deleteHolding);

module.exports = router;
