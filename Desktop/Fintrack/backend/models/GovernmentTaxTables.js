const mongoose = require('mongoose');

/**
 * PHILIPPINE GOVERNMENT CONTRIBUTION & WITHHOLDING TAX TABLES
 * Based on SSS, PhilHealth, Pag-IBIG, and BIR TRAIN Law
 * 
 * These are FIXED DATA used for payroll computation.
 * Store in database for easy updates without code changes.
 */

// SSS Contribution Table (Employee + Employer Share)
const sssContributionSchema = new mongoose.Schema({
  salaryRange: {
    min: Number,
    max: Number,
  },
  monthlyContribution: Number, // Employee share only
  employerShare: Number, // For reference
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

// PhilHealth Contribution Table
const philhealthContributionSchema = new mongoose.Schema({
  salaryRange: {
    min: Number,
    max: Number,
  },
  monthlyContribution: Number, // Employee share = Employer share
  employerShare: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

// Pag-IBIG Contribution Table
const pagibigContributionSchema = new mongoose.Schema({
  salaryRange: {
    min: Number,
    max: Number,
  },
  monthlyContribution: Number, // Employee share (1% or 2% based on salary)
  employerShare: Number, // 2% always
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

// BIR TRAIN Law Withholding Tax Table (PY 2024)
// Taxable Income brackets with rates and fixed deduction
const withholdinTaxSchema = new mongoose.Schema({
  taxYear: { type: Number, default: 2024 },
  incomeRange: {
    min: Number,
    max: Number,
  },
  taxRate: Number, // Percentage
  fixedTaxAmount: Number, // Fixed deduction from lower bracket
  description: String, // e.g., "Not Subject to Tax", "5%", "10%", etc.
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

// Tax Exemptions and Adjustments
const taxExemptionSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  applicableMonths: [Number], // 1-12 for specific months, or empty for all months
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const governmentTaxTablesSchema = new mongoose.Schema({
  // SSS Contributions (Monthly)
  sssContributions: [sssContributionSchema],
  
  // PhilHealth Contributions (Monthly)
  philhealthContributions: [philhealthContributionSchema],
  
  // Pag-IBIG Contributions (Monthly)
  pagibigContributions: [pagibigContributionSchema],
  
  // Withholding Tax (Monthly, based on taxable income)
  withholdingTaxBrackets: [withholdinTaxSchema],
  
  // Tax Exemptions (Personal exemption, etc.)
  taxExemptions: [taxExemptionSchema],
  
  // Metadata
  effectiveDate: Date,
  version: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const GovernmentTaxTables = mongoose.model('GovernmentTaxTables', governmentTaxTablesSchema);

module.exports = GovernmentTaxTables;

/**
 * DEFAULT PHILIPPINE CONTRIBUTION TABLES (PY 2024)
 * 
 * SSS EMPLOYEE CONTRIBUTIONS (Monthly):
 * Salary Range          Monthly Contribution
 * 1,000.00 - 1,249.99         110.00
 * 1,250.00 - 1,499.99         137.50
 * 1,500.00 - 1,749.99         165.00
 * ... up to ...
 * 29,750.00 - 29,999.99       3,652.50
 * 30,000.00 and above         3,652.50 (max)
 * 
 * PhilHealth EMPLOYEE CONTRIBUTIONS (Monthly):
 * Salary Range          Monthly Contribution
 * Below 10,000                 0.00 (exempted)
 * 10,000.01 - 40,000           (Salary * 2.75%) / 2 = Employee share
 * 40,000.01 and above          (40,000 * 2.75%) / 2 = 550.00 (cap)
 * 
 * Pag-IBIG EMPLOYEE CONTRIBUTIONS (Monthly):
 * Salary Range          Contribution Rate
 * 1,500.00 - 4,999.99          1.00% of salary
 * 5,000.00 and above           2.00% of salary (max ₱200)
 * 
 * BIR TRAIN LAW WITHHOLDING TAX (Monthly, PY 2024):
 * Taxable Income              Tax Rate      Fixed Deduction
 * 0 - 250,000                 0%            0
 * 250,001 - 400,000           15%           37,500
 * 400,001 - 800,000           20%           97,500
 * 800,001 - 2,000,000         25%           297,500
 * 2,000,001 and above         30%           797,500
 * 
 * PREMIUM PAY RATES:
 * Regular Overtime            = Base Rate × 1.25
 * Night Differential          = Base Rate × 1.10
 * Special Holiday (not work)  = Base Rate
 * Special Holiday (work)      = Base Rate × 1.30
 * Regular Holiday (not work)  = Base Rate
 * Regular Holiday (work)      = Base Rate × 2.00
 * Sunday (rest day, work)     = Base Rate × 1.30
 */
