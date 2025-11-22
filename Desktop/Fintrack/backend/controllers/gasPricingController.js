const GasPricing = require('../models/GasPricing');

// Get current gas price
exports.getCurrentPrice = async (req, res) => {
  try {
    const currentPrice = await GasPricing.findOne({
      effectiveDate: { $lte: new Date() },
    })
      .populate('updatedBy', 'firstName lastName')
      .sort({ effectiveDate: -1 });

    res.status(200).json({
      success: true,
      data: currentPrice || { price: 0, currency: 'PHP', message: 'No pricing set yet' },
    });
  } catch (error) {
    console.error('Error fetching current price:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gas price',
      error: error.message,
    });
  }
};

// Get all pricing history
exports.getPricingHistory = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const history = await GasPricing.find({
      createdAt: { $gte: startDate },
    })
      .populate('updatedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching pricing history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing history',
      error: error.message,
    });
  }
};

// Update gas price (HR Head only)
exports.updatePrice = async (req, res) => {
  try {
    const { price, effectiveDate, notes } = req.body;
    const userId = req.user.id;

    // Validation
    const numPrice = parseFloat(price);
    if (!numPrice || numPrice <= 0 || isNaN(numPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required and must be greater than 0',
      });
    }

    if (!effectiveDate) {
      return res.status(400).json({
        success: false,
        message: 'Effective date is required',
      });
    }

    // Parse effective date safely
    const parsedDate = new Date(effectiveDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
      });
    }

    // Get previous price
    const previousPrice = await GasPricing.findOne({
      effectiveDate: { $lte: new Date() },
    }).sort({ effectiveDate: -1 });

    // Create new pricing record
    const newPricing = new GasPricing({
      price: numPrice,
      currency: 'PHP',
      effectiveDate: parsedDate,
      updatedBy: userId,
      notes: notes || '',
      priceHistory: previousPrice
        ? [
            ...previousPrice.priceHistory,
            {
              price: previousPrice.price,
              date: new Date(),
            },
          ]
        : [
            {
              price: numPrice,
              date: new Date(),
            },
          ],
    });

    await newPricing.save();
    await newPricing.populate('updatedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Gas price updated successfully',
      data: newPricing,
    });
  } catch (error) {
    console.error('Error updating price:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update gas price',
      error: error.message,
    });
  }
};

// Get price for next 3 days
exports.getUpcomingPrices = async (req, res) => {
  try {
    const today = new Date();
    const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    const upcoming = await GasPricing.find({
      effectiveDate: {
        $gte: today,
        $lte: threeDaysLater,
      },
    })
      .populate('updatedBy', 'firstName lastName')
      .sort({ effectiveDate: 1 });

    res.status(200).json({
      success: true,
      data: upcoming,
    });
  } catch (error) {
    console.error('Error fetching upcoming prices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming prices',
      error: error.message,
    });
  }
};
