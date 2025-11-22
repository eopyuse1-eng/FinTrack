/**
 * Tax Settings Routes
 * Configure system-wide tax rules
 */

const express = require('express');
const router = express.Router();
const taxSettingsController = require('../controllers/taxSettingsController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

/**
 * GET /api/tax-settings
 * Get current tax settings
 * HR Head only
 */
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['hr_head']),
  taxSettingsController.getTaxSettings
);

/**
 * PUT /api/tax-settings
 * Update tax settings and sync to all employees
 * HR Head only
 */
router.put(
  '/',
  authMiddleware,
  roleMiddleware(['hr_head']),
  taxSettingsController.updateTaxSettings
);

/**
 * GET /api/tax-settings/summary
 * Get tax exemption summary
 * HR Head, HR Staff
 */
router.get(
  '/summary',
  authMiddleware,
  roleMiddleware(['hr_head', 'hr_staff']),
  taxSettingsController.getTaxExemptionSummary
);

module.exports = router;
