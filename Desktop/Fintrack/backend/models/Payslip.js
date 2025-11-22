const mongoose = require('mongoose');

/**
 * PAYSLIP
 * Generated payslip document for employee viewing
 * 
 * One-to-one relationship with PayrollRecord
 * Contains all final computation data ready for PDF generation
 */

const payslipSchema = new mongoose.Schema(
  {
    // Linkage
    payrollRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollRecord',
      required: true,
      unique: true,
    },
    
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
    
    // ============ EMPLOYEE INFO (snapshot at time of generation) ============
    employeeDetails: {
      firstName: String,
      lastName: String,
      email: String,
      position: String,
      department: String,
      employmentStatus: String,
      sssNumber: String,
      philhealthNumber: String,
      pagibigNumber: String,
      tinNumber: String,
    },
    
    // ============ PERIOD INFO ============
    periodInfo: {
      periodName: String,
      startDate: Date,
      endDate: Date,
      paymentDate: Date,
      paymentMethod: String, // e.g., "Bank Transfer", "Cash"
    },
    
    // ============ COMPUTATION SUMMARY ============
    computationSummary: {
      workDays: Number,
      presentDays: Number,
      absenceDays: Number,
      paidLeaveDays: Number,
      unpaidLeaveDays: Number,
    },
    
    // ============ EARNINGS BREAKDOWN ============
    earnings: {
      basicSalary: Number,
      overtimePay: Number,
      nightDifferentialPay: Number,
      holidayPay: Number,
      paidLeavePay: Number,
      allowances: Number,
      bonusesReimbursements: Number,
      grossPay: Number,
    },
    
    // ============ DEDUCTIONS BREAKDOWN ============
    deductions: {
      lateDeduction: Number,
      undertimeDeduction: Number,
      absenceDeduction: Number,
      sssContribution: Number,
      philhealthContribution: Number,
      pagibigContribution: Number,
      withholdinTax: Number,
      loanDeductions: Number,
      otherDeductions: Number,
      totalDeductions: Number,
    },
    
    // ============ FINAL COMPUTATION ============
    netPay: Number,
    
    // ============ PAYMENT INFO ============
    paymentInfo: {
      bankName: String,
      accountNumber: String,
      accountName: String,
    },
    
    // ============ DIGITAL SIGNATURE & AUTHENTICITY ============
    approvedBy: {
      name: String,
      position: String,
      signature: String, // Base64 or URL
      approvalDate: Date,
    },
    
    // ============ PDF GENERATION ============
    pdfGenerated: { type: Boolean, default: false },
    pdfPath: String, // Path to stored PDF file
    pdfGeneratedAt: Date,
    
    // ============ STATUS ============
    status: {
      type: String,
      enum: ['draft', 'generated', 'viewed', 'downloaded', 'printed'],
      default: 'draft',
    },
    
    viewedAt: Date,
    viewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    downloadedAt: Date,
    downloadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    // ============ AUDIT ============
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

/**
 * INDEXES
 */
payslipSchema.index({ payrollRecord: 1 });
payslipSchema.index({ payrollPeriod: 1, employee: 1 });
payslipSchema.index({ employee: 1 });

/**
 * METHOD: Mark as viewed
 */
payslipSchema.methods.markAsViewed = function (userId) {
  this.status = 'viewed';
  this.viewedAt = new Date();
  this.viewedBy = userId;
};

/**
 * METHOD: Mark as downloaded
 */
payslipSchema.methods.markAsDownloaded = function (userId) {
  this.status = 'downloaded';
  this.downloadedAt = new Date();
  this.downloadedBy = userId;
};

/**
 * METHOD: Check if payslip is locked (no changes)
 */
payslipSchema.methods.isLocked = function () {
  return this.status !== 'draft';
};

module.exports = mongoose.model('Payslip', payslipSchema);
