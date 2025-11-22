/**
 * Voucher Controller
 * Handles voucher creation, management, and transaction tracking
 */

const { Voucher } = require('../models/Voucher');
const { VoucherTransaction } = require('../models/VoucherTransaction');
const { AuditLog } = require('../models/AuditLog');

/**
 * POST /api/vouchers
 * Create new voucher batch
 * Treasury staff only
 */
exports.createVoucher = async (req, res) => {
  try {
    const {
      voucherCode,
      voucherType,
      totalStock,
      voucherValue,
      validFrom,
      validUntil,
      lowStockThreshold,
      description,
    } = req.body;

    // Validate input
    if (!voucherCode || !voucherType || !totalStock || !voucherValue) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Check if voucher code already exists
    const existingVoucher = await Voucher.findOne({ voucherCode: voucherCode.toUpperCase() });
    if (existingVoucher) {
      return res.status(409).json({
        success: false,
        message: 'Voucher code already exists',
      });
    }

    // Validate dates
    const fromDate = new Date(validFrom);
    const untilDate = new Date(validUntil);
    if (fromDate >= untilDate) {
      return res.status(400).json({
        success: false,
        message: 'Valid until date must be after valid from date',
      });
    }

    // Create voucher
    const voucher = new Voucher({
      voucherCode: voucherCode.toUpperCase(),
      voucherType,
      totalStock,
      availableStock: totalStock,
      voucherValue,
      validFrom: fromDate,
      validUntil: untilDate,
      lowStockThreshold: lowStockThreshold || 10,
      description,
      createdBy: req.user.id,
    });

    await voucher.save();

    // Log transaction
    await VoucherTransaction.create({
      voucher: voucher._id,
      transactionType: 'created',
      quantity: totalStock,
      description: `Voucher batch created: ${voucherCode}`,
      recordedBy: req.user.id,
    });

    // Audit log
    await AuditLog.create({
      user: req.user.id,
      action: 'VOUCHER_CREATED',
      details: `Created voucher batch: ${voucherCode} (${totalStock} units @ ₱${voucherValue})`,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Voucher batch created successfully',
      data: voucher,
    });
  } catch (error) {
    console.error('Create voucher error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create voucher',
      error: error.message,
    });
  }
};

/**
 * GET /api/vouchers
 * Get all vouchers with filters
 */
exports.getVouchers = async (req, res) => {
  try {
    const { status, voucherType, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (voucherType) filter.voucherType = voucherType;

    const vouchers = await Voucher.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Voucher.countDocuments(filter);

    res.json({
      success: true,
      data: vouchers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get vouchers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vouchers',
      error: error.message,
    });
  }
};

/**
 * GET /api/vouchers/:id
 * Get single voucher details with transactions
 */
exports.getVoucherDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const voucher = await Voucher.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email');

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found',
      });
    }

    // Get transaction history
    const transactions = await VoucherTransaction.find({ voucher: id })
      .populate('usedBy', 'firstName lastName email')
      .populate('recordedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        voucher,
        transactions,
        summary: {
          totalStock: voucher.totalStock,
          availableStock: voucher.availableStock,
          usedStock: voucher.usedStock,
          expiredStock: voucher.expiredStock,
          stockPercentage: voucher.getStockPercentage(),
          isLowStock: voucher.isLowStock(),
          isExpired: voucher.isExpired(),
        },
      },
    });
  } catch (error) {
    console.error('Get voucher details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch voucher details',
      error: error.message,
    });
  }
};

/**
 * POST /api/vouchers/:id/use
 * Use/Deduct vouchers
 */
exports.useVouchers = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, usedBy, referenceId, referenceType, description } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity',
      });
    }

    const voucher = await Voucher.findById(id);
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found',
      });
    }

    // Use voucher
    await voucher.useVoucher(quantity);

    // Log transaction
    await VoucherTransaction.create({
      voucher: id,
      transactionType: 'used',
      quantity,
      usedBy,
      referenceId,
      referenceType,
      description,
      recordedBy: req.user.id,
    });

    // Audit log
    await AuditLog.create({
      user: req.user.id,
      action: 'VOUCHER_USED',
      details: `Used ${quantity} unit(s) of voucher ${voucher.voucherCode}. Remaining: ${voucher.availableStock}`,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: 'Vouchers used successfully',
      data: {
        voucherCode: voucher.voucherCode,
        quantityUsed: quantity,
        availableStock: voucher.availableStock,
        isLowStock: voucher.isLowStock(),
      },
    });
  } catch (error) {
    console.error('Use vouchers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to use vouchers',
    });
  }
};

/**
 * POST /api/vouchers/:id/replenish
 * Add stock to voucher
 * HR Head only
 */
exports.replenishVouchers = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, description } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity',
      });
    }

    const voucher = await Voucher.findById(id);
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found',
      });
    }

    // Replenish stock
    await voucher.replenishStock(quantity, req.user.id);

    // Log transaction
    await VoucherTransaction.create({
      voucher: id,
      transactionType: 'replenished',
      quantity,
      description: description || `Stock replenished by ${req.user.firstName} ${req.user.lastName}`,
      recordedBy: req.user.id,
    });

    // Audit log
    await AuditLog.create({
      user: req.user.id,
      action: 'VOUCHER_REPLENISHED',
      details: `Replenished ${quantity} unit(s) for voucher ${voucher.voucherCode}. New total: ${voucher.totalStock}`,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: 'Vouchers replenished successfully',
      data: {
        voucherCode: voucher.voucherCode,
        totalStock: voucher.totalStock,
        availableStock: voucher.availableStock,
      },
    });
  } catch (error) {
    console.error('Replenish vouchers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to replenish vouchers',
      error: error.message,
    });
  }
};

/**
 * POST /api/vouchers/:id/status
 * Update voucher status
 */
exports.updateVoucherStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'paused', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const voucher = await Voucher.findByIdAndUpdate(
      id,
      {
        status,
        lastModifiedBy: req.user.id,
        lastModifiedAt: new Date(),
      },
      { new: true }
    );

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found',
      });
    }

    // Audit log
    await AuditLog.create({
      user: req.user.id,
      action: 'VOUCHER_STATUS_CHANGED',
      details: `Changed voucher ${voucher.voucherCode} status to ${status}`,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: 'Voucher status updated',
      data: voucher,
    });
  } catch (error) {
    console.error('Update voucher status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update voucher status',
      error: error.message,
    });
  }
};

/**
 * GET /api/vouchers/low-stock
 * Get vouchers with low stock
 */
exports.getLowStockVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find({
      $expr: { $lte: ['$availableStock', '$lowStockThreshold'] },
      status: 'active',
    })
      .populate('createdBy', 'firstName lastName')
      .sort({ availableStock: 1 });

    res.json({
      success: true,
      data: vouchers,
      count: vouchers.length,
    });
  } catch (error) {
    console.error('Get low stock vouchers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock vouchers',
      error: error.message,
    });
  }
};

module.exports = exports;
