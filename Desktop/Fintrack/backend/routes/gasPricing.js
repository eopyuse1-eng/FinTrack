const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const gasPricingController = require('../controllers/gasPricingController');

// Get current price (public)
router.get('/current', authMiddleware, gasPricingController.getCurrentPrice);

// Get pricing history
router.get('/history', authMiddleware, gasPricingController.getPricingHistory);

// Get upcoming prices for next 3 days
router.get('/upcoming', authMiddleware, gasPricingController.getUpcomingPrices);

// Update price (HR Head only)
router.post('/update', authMiddleware, (req, res, next) => {
  if (req.user.role !== 'hr_head') {
    return res.status(403).json({
      success: false,
      message: 'Only HR Head can update gas prices',
    });
  }
  next();
}, gasPricingController.updatePrice);

module.exports = router;
