/**
 * Tax Settings Model
 * Stores system-wide tax configuration
 */

const mongoose = require('mongoose');

const taxSettingsSchema = new mongoose.Schema(
  {
    // Minimum annual income threshold for tax exemption
    minimumTaxableIncome: {
      type: Number,
      default: 250000,
      description: 'Employees earning below this amount are tax-exempt (annual)',
    },

    // Enable/disable tax exemption feature
    taxExemptionEnabled: {
      type: Boolean,
      default: true,
      description: 'If false, all employees pay tax regardless of income',
    },

    // Auto-apply exemption to all employees below threshold
    autoApplyExemption: {
      type: Boolean,
      default: true,
      description: 'If true, automatically mark employees below threshold as tax-exempt',
    },

    // Audit trail
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      description: 'HR Head who last modified these settings',
    },

    lastModifiedAt: {
      type: Date,
      default: Date.now,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TaxSettings', taxSettingsSchema);
