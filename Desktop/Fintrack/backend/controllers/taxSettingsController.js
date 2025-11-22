/**
 * Tax Settings Controller
 * Manage system-wide tax configuration and auto-sync to employees
 */

const TaxSettings = require('../models/TaxSettings');
const EmployeeSalaryConfig = require('../models/EmployeeSalaryConfig');
const { User } = require('../models/User');

/**
 * GET /api/tax-settings
 * Get current tax settings
 */
exports.getTaxSettings = async (req, res) => {
  try {
    let settings = await TaxSettings.findOne()
      .populate('lastModifiedBy', 'firstName lastName email');

    // If no settings exist, create defaults
    if (!settings) {
      settings = new TaxSettings({
        minimumTaxableIncome: 250000,
        taxExemptionEnabled: true,
        autoApplyExemption: true,
        lastModifiedBy: req.user.id,
      });
      await settings.save();
    }

    res.json({
      success: true,
      settings: {
        minimumTaxableIncome: settings.minimumTaxableIncome,
        taxExemptionEnabled: settings.taxExemptionEnabled,
        autoApplyExemption: settings.autoApplyExemption,
        lastModifiedBy: settings.lastModifiedBy,
        lastModifiedAt: settings.lastModifiedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching tax settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tax settings',
      error: error.message,
    });
  }
};

/**
 * PUT /api/tax-settings
 * Update tax settings and sync to all employees
 */
exports.updateTaxSettings = async (req, res) => {
  try {
    const { minimumTaxableIncome, taxExemptionEnabled, autoApplyExemption } = req.body;

    if (!minimumTaxableIncome || minimumTaxableIncome <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid minimum taxable income',
      });
    }

    // Update settings
    let settings = await TaxSettings.findOne();
    if (!settings) {
      settings = new TaxSettings();
    }

    settings.minimumTaxableIncome = minimumTaxableIncome;
    settings.taxExemptionEnabled = taxExemptionEnabled;
    settings.autoApplyExemption = autoApplyExemption;
    settings.lastModifiedBy = req.user.id;
    settings.lastModifiedAt = new Date();
    await settings.save();

    console.log('✓ Tax settings updated');
    console.log(`  Minimum Taxable Income: ₱${minimumTaxableIncome.toLocaleString('en-PH')}`);
    console.log(`  Tax Exemption Enabled: ${taxExemptionEnabled}`);
    console.log(`  Auto-Apply Exemption: ${autoApplyExemption}`);

    // AUTO-SYNC: Apply exemption to all employees below threshold
    if (autoApplyExemption && taxExemptionEnabled) {
      console.log('\n🔄 Auto-syncing tax exemption to employees...');

      const salaryConfigs = await EmployeeSalaryConfig.find();
      let exemptedCount = 0;
      let notExemptedCount = 0;

      for (const config of salaryConfigs) {
        const annualIncome = (config.monthlyRate || config.dailyRate * 26) * 12;

        if (annualIncome < minimumTaxableIncome) {
          config.isTaxExempt = true;
          config.taxExemptionReason = `Below minimum taxable income (₱${minimumTaxableIncome.toLocaleString('en-PH')})`;
          config.taxExemptionStartDate = new Date();
          exemptedCount++;
        } else {
          config.isTaxExempt = false;
          config.taxExemptionReason = null;
          config.taxExemptionStartDate = null;
          notExemptedCount++;
        }

        await config.save();
      }

      console.log(`✓ Synced to ${salaryConfigs.length} employees`);
      console.log(`  Tax Exempt: ${exemptedCount}`);
      console.log(`  Not Exempt: ${notExemptedCount}`);
    }

    res.json({
      success: true,
      message: 'Tax settings updated and synced to all employees',
      settings: {
        minimumTaxableIncome: settings.minimumTaxableIncome,
        taxExemptionEnabled: settings.taxExemptionEnabled,
        autoApplyExemption: settings.autoApplyExemption,
      },
    });
  } catch (error) {
    console.error('Error updating tax settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tax settings',
      error: error.message,
    });
  }
};

/**
 * GET /api/tax-settings/summary
 * Get tax exemption summary for all employees
 */
exports.getTaxExemptionSummary = async (req, res) => {
  try {
    const settings = await TaxSettings.findOne();
    const salaryConfigs = await EmployeeSalaryConfig.find()
      .populate('employee', 'firstName lastName email');

    let taxExemptCount = 0;
    let taxableCount = 0;
    const exemptedEmployees = [];

    for (const config of salaryConfigs) {
      if (config.isTaxExempt) {
        taxExemptCount++;
        exemptedEmployees.push({
          name: `${config.employee.firstName} ${config.employee.lastName}`,
          email: config.employee.email,
          reason: config.taxExemptionReason,
          exemptionDate: config.taxExemptionStartDate,
        });
      } else {
        taxableCount++;
      }
    }

    res.json({
      success: true,
      summary: {
        minimumTaxableIncome: settings?.minimumTaxableIncome || 250000,
        taxExemptionEnabled: settings?.taxExemptionEnabled || true,
        totalEmployees: salaryConfigs.length,
        taxExemptCount,
        taxableCount,
        exemptedEmployees,
      },
    });
  } catch (error) {
    console.error('Error getting tax exemption summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting tax exemption summary',
      error: error.message,
    });
  }
};

module.exports = exports;
