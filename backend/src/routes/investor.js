const express = require('express');
const router = express.Router();
const investorController = require('../controllers/investorController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and investor role
router.use(authenticate);
router.use(authorize('investor'));

// Portfolio routes
router.get('/portfolio', investorController.getPortfolio);
router.get('/portfolio/:id', investorController.getHoldingDetails);

// Share prices route
router.get('/share-prices', investorController.getSharePrices);

module.exports = router;
