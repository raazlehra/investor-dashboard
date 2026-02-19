const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginLimiter, checkRecentFailedAttempts } = require('../middleware/rateLimiter');

// Validation rules
const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Routes
router.post('/login', loginLimiter, checkRecentFailedAttempts, loginValidation, authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/validate', authenticate, authController.validateToken);
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
