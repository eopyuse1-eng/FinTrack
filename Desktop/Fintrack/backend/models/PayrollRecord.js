const mongoose = require('mongoose');

/**
 * PAYROLL RECORD
 * Complete salary computation for one employee in one payroll period
 * 
 * This is the core payroll computation document
 * Stores all earnings, deductions, and calculations
 */

const payrollRecordSchema = new mongoose.Schema(
  {
    // Identifiers
    payrollPeriod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollPeriod',
      required: true,
    },
    
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    salaryConfig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployeeSalaryConfig',
      description: 'Reference to salary config used for this computation',
    },
    
    // ============ ATTENDANCE DATA ============
    attendance: {
      workDaysInPeriod: { type: Number, default: 0 },
      presentDays: { type: Number, default: 0 },
      absenceDays: { type: Number, default: 0 },
      tardinessMins: { type: Number, default: 0 }, // Total late minutes
      undertimeMins: { type: Number, default: 0 }, // Total undertime minutes
      overtimeHours: { type: Number, default: 0 }, // Total OT hours
      nightDifferentialHours: { type: Number, default: 0 }, // Total ND hours
    },
    
    // ============ LEAVES ============
    leaves: {
      paidLeaveDays: { type: Number, default: 0 },
      unpaidLeaveDays: { type: Number, default: 0 },
      sickLeaveDays: { type: Number, default: 0 },
      vacationLeaveDays: { type: Number, default: 0 },
    },
    
    // ============ HOLIDAY PAY ============
    holidayPay: {
      specialHolidayHours: { type: Number, default: 0 },
      specialHolidayAmountWorked: { type: Number, default: 0 }, // If worked: 1.30x
      regularHolidayHours: { type: Number, default: 0 },
      regularHolidayAmountWorked: { type: Number, default: 0 }, // If worked: 2.00x
    },
    
    // ============ EARNINGS ============
    earnings: {
      basicSalary: { type: Number, default: 0 }, // (Daily Rate * Presence Days)
      overtimePay: { type: Number, default: 0 }, // OT Hours * Hourly Rate * 1.25
      nightDifferentialPay: { type: Number, default: 0 }, // ND Hours * Hourly Rate * 1.10
      holidayPay: { type: Number, default: 0 }, // Special + Regular holiday pay
      paidLeavePay: { type: Number, default: 0 }, // Paid leave * Daily Rate
      allowances: { type: Number, default: 0 }, // Sum of all allowances
      bonusesReimbursements: { type: Number, default: 0 }, // Ad-hoc additions
      otherAdditions: { type: Number, default: 0 }, // Any other earnings
      grossPay: { type: Number, default: 0 }, // Total earnings before deductions
    },
    
    // ============ DEDUCTIONS ============
    deductions: {
      // Penalty Deductions
      lateDeduction: { type: Number, default: 0 }, // (Late Mins / 60) * Hourly Rate
      undertimeDeduction: { type: Number, default: 0 }, // (UT Mins / 60) * Hourly Rate
      absenceDeduction: { type: Number, default: 0 }, // Daily Rate * Absence Days
      
      // Government Contributions
      sssContribution: { type: Number, default: 0 },
      philhealthContribution: { type: Number, default: 0 },
      pagibigContribution: { type: Number, default: 0 },
      
      // Income Tax
      withholdinTax: { type: Number, default: 0 },
      
      // Other Deductions
      loanDeductions: { type: Number, default: 0 },
      otherDeductions: { type: Number, default: 0 },
      
      totalDeductions: { type: Number, default: 0 }, // Sum of all deductions
    },
    
    // ============ NET PAY ============
    netPay: { type: Number, default: 0 }, // Gross Pay - Total Deductions
    
    // ============ DETAILED TAX CALCULATION ============
    taxCalculation: {
      taxableIncome: { type: Number, default: 0 }, // Gross - Tax Exemptions
      taxRate: { type: Number, default: 0 }, // BIR rate applied
      fixedTaxAmount: { type: Number, default: 0 }, // BIR fixed deduction
      personalExemption: { type: Number, default: 0 }, // Annual personal exemption / 12
      dependentExemption: { type: Number, default: 0 }, // Annual dependent exemption / 12
      computedTax: { type: Number, default: 0 }, // Manual calculation for reference
    },
    
    // ============ STATUS & APPROVAL ============
    status: {
      type: String,
      enum: [
        'draft', // Initial creation
        'computed', // Computation done, pending review
        'pending_approval', // Awaiting HR Head approval
        'approved', // HR Head approved
        'locked', // Cannot be edited
        'rejected', // HR Head rejected, needs recomputation
      ],
      default: 'draft',
    },
    
    computedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      description: 'HR Staff who computed this payroll',
    },
    
    computedAt: Date,
    
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      description: 'HR Head who approved',
    },
    
    approvedAt: Date,
    
    rejectionReason: String, // If rejected, reason why
    
    // ============ ADJUSTMENTS ============
    adjustments: [
      {
        type: {
          type: String,
          enum: ['bonus', 'reimbursement', 'deduction', 'cash_advance', 'other'],
        },
        description: String,
        amount: Number,
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    
    // ============ NOTES & AUDIT ============
    computationNotes: String, // HR Staff notes during computation
    approvalNotes: String, // HR Head notes during approval
    
    // Flags for manual override
    isManualAdjusted: { type: Boolean, default: false },
    manualAdjustmentReason: String,
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

/**
 * INDEXES for fast queries
 */
payrollRecordSchema.index({ payrollPeriod: 1, employee: 1 }, { unique: true });
payrollRecordSchema.index({ employee: 1 });
payrollRecordSchema.index({ status: 1 });
payrollRecordSchema.index({ payrollPeriod: 1 });

/**
 * METHOD: Check if locked (no edits allowed)
 */
payrollRecordSchema.methods.isLocked = function () {
  return this.status === 'locked' || this.status === 'approved';
};

/**
 * METHOD: Recalculate Gross Pay
 */
payrollRecordSchema.methods.calculateGrossPay = function () {
  this.earnings.grossPay =
    (this.earnings.basicSalary || 0) +
    (this.earnings.overtimePay || 0) +
    (this.earnings.nightDifferentialPay || 0) +
    (this.earnings.holidayPay || 0) +
    (this.earnings.paidLeavePay || 0) +
    (this.earnings.allowances || 0) +
    (this.earnings.bonusesReimbursements || 0) +
    (this.earnings.otherAdditions || 0);

  return this.earnings.grossPay;
};

/**
 * METHOD: Recalculate Total Deductions
 */
payrollRecordSchema.methods.calculateTotalDeductions = function () {
  this.deductions.totalDeductions =
    (this.deductions.lateDeduction || 0) +
    (this.deductions.undertimeDeduction || 0) +
    (this.deductions.absenceDeduction || 0) +
    (this.deductions.sssContribution || 0) +
    (this.deductions.philhealthContribution || 0) +
    (this.deductions.pagibigContribution || 0) +
    (this.deductions.withholdinTax || 0) +
    (this.deductions.loanDeductions || 0) +
    (this.deductions.otherDeductions || 0);

  return this.deductions.totalDeductions;
};

/**
 * METHOD: Calculate Net Pay
 */
payrollRecordSchema.methods.calculateNetPay = function () {
  this.calculateGrossPay();
  this.calculateTotalDeductions();

  this.netPay = this.earnings.grossPay - this.deductions.totalDeductions;
  return this.netPay;
};

module.exports = mongoose.model('PayrollRecord', payrollRecordSchema);
