const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const voucherController = require('../controllers/voucherController');

const router = express.Router();

/**
 * POST /api/vouchers
 * Create new voucher batch (Treasury staff only)
 */
router.post('/', authMiddleware, roleMiddleware(['treasury']), voucherController.createVoucher);

/**
 * GET /api/vouchers
 * Get all vouchers with pagination and filters
 */
router.get('/', authMiddleware, voucherController.getVouchers);

/**
 * GET /api/vouchers/low-stock
 * Get vouchers with low stock (for notifications)
 */
router.get('/low-stock', authMiddleware, voucherController.getLowStockVouchers);

/**
 * GET /api/vouchers/:id
 * Get single voucher details with transaction history
 */
router.get('/:id', authMiddleware, voucherController.getVoucherDetails);

/**
 * POST /api/vouchers/:id/use
 * Use/deduct vouchers
 */
router.post('/:id/use', authMiddleware, voucherController.useVouchers);

/**
 * POST /api/vouchers/:id/replenish
 * Replenish stock (HR Head only)
 */
router.post('/:id/replenish', authMiddleware, roleMiddleware(['hr_head']), voucherController.replenishVouchers);

/**
 * POST /api/vouchers/:id/status
 * Update voucher status
 */
router.post('/:id/status', authMiddleware, roleMiddleware(['treasury', 'hr_head']), voucherController.updateVoucherStatus);

module.exports = router;
