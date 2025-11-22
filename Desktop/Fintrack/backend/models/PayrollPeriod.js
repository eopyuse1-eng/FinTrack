const mongoose = require('mongoose');

/**
 * PAYROLL PERIOD
 * Represents a payroll cycle (monthly, semi-monthly, etc.)
 * 
 * Status flow: draft → pending_computation → pending_approval → approved → locked → payroll_run
 */

const payrollPeriodSchema = new mongoose.Schema(
  {
    // Period Identification
    periodName: {
      type: String,
      required: true,
      description: 'e.g., "January 2024", "1st Half January 2024"',
    },
    
    payrollCycle: {
      type: String,
      enum: ['monthly', 'semi_monthly', 'bi_weekly'],
      default: 'monthly',
    },
    
    // Date Range
    startDate: {
      type: Date,
      required: true,
    },
    
    endDate: {
      type: Date,
      required: true,
    },
    
    // Cutoff Dates (for attendance computation)
    attendanceCutoffStart: {
      type: Date,
      description: 'When to start counting attendance for this period',
    },
    
    attendanceCutoffEnd: {
      type: Date,
      description: 'When to stop counting attendance for this period',
    },
    
    // Special Days (Holidays, special non-working days)
    specialDays: [
      {
        date: Date,
        dayType: {
          type: String,
          enum: ['special_holiday', 'regular_holiday', 'declared_holiday'],
        },
        description: String, // e.g., "All Saints Day"
      },
    ],
    
    // Status Progression
    status: {
      type: String,
      enum: [
        'draft', // Just created, payroll not yet computed
        'pending_computation', // Ready for HR Staff to compute
        'computation_completed', // HR Staff has computed all payroll records
        'pending_approval', // Ready for HR Head approval
        'approved', // HR Head approved
        'locked', // No more changes allowed
        'payroll_run', // Payroll has been run/disbursed
        'cancelled', // Payroll period cancelled
      ],
      default: 'draft',
    },
    
    // Computations
    totalEmployeesInPayroll: { type: Number, default: 0 },
    totalRecordsComputed: { type: Number, default: 0 },
    totalRecordsApproved: { type: Number, default: 0 },
    totalGrossPay: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    totalNetPay: { type: Number, default: 0 },
    
    // Approval Chain
    computedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      description: 'HR Staff who initiated computation',
    },
    
    computedAt: Date,
    
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      description: 'HR Head who approved payroll',
    },
    
    approvedAt: Date,
    
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      description: 'User who locked the payroll period',
    },
    
    lockedAt: Date,
    
    payrollRunBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    payrollRunAt: Date,
    
    // Notes/Comments
    computationNotes: String,
    approvalNotes: String,
    cancellationReason: String,
    
    // Audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

/**
 * INDEX: Fast lookup by date range and status
 */
payrollPeriodSchema.index({ startDate: 1, endDate: 1 });
payrollPeriodSchema.index({ status: 1 });
payrollPeriodSchema.index({ periodName: 1 });

/**
 * METHOD: Check if period is locked (no more changes allowed)
 */
payrollPeriodSchema.methods.isLocked = function () {
  return this.status === 'locked' || this.status === 'payroll_run';
};

/**
 * METHOD: Transition to next status
 */
payrollPeriodSchema.methods.transitionStatus = function (newStatus) {
  const validTransitions = {
    draft: ['pending_computation', 'cancelled'],
    pending_computation: ['computation_completed', 'draft'],
    computation_completed: ['pending_approval', 'pending_computation'],
    pending_approval: ['approved', 'computation_completed'],
    approved: ['locked', 'pending_approval'],
    locked: ['payroll_run'],
    payroll_run: [], // Final state
    cancelled: [], // Final state
  };

  if (validTransitions[this.status] && validTransitions[this.status].includes(newStatus)) {
    this.status = newStatus;
    return true;
  }

  return false;
};

module.exports = mongoose.model('PayrollPeriod', payrollPeriodSchema);
