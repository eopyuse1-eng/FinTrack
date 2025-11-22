const mongoose = require('mongoose');

/**
 * EMPLOYEE SALARY CONFIGURATION
 * Stores employee's salary information and payroll settings
 * 
 * One-to-one relationship with Employee model
 * Updated whenever employee's salary changes
 */

const employeeSalaryConfigSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    
    // Salary Type: daily_rate or monthly_rate
    salaryType: {
      type: String,
      enum: ['daily_rate', 'monthly_rate'],
      default: 'daily_rate',
      required: true,
    },
    
    // Basic Salary Amounts
    dailyRate: {
      type: Number,
      required: true,
      description: 'Fixed daily rate (used if salaryType = daily_rate)',
    },
    
    monthlyRate: {
      type: Number,
      description: 'Monthly rate. If provided, dailyRate = monthlyRate / 26',
    },
    
    hourlyRate: {
      type: Number,
      description: 'Computed from dailyRate (dailyRate / 8) or monthlyRate / 208',
    },
    
    // Standard Work Schedule
    workSchedule: {
      type: String,
      enum: ['monday_saturday', 'monday_friday'], // Mon-Sat or Mon-Fri
      default: 'monday_saturday',
      description: 'Weekly work schedule (excluding rest day)',
    },
    
    // Government Contributions (Configuration)
    sssNumber: String,
    philhealthNumber: String,
    pagibigNumber: String,
    tinNumber: String, // Tax Identification Number
    
    // Allowances and Fixed Deductions (Monthly)
    allowances: [
      {
        name: String, // e.g., "Meal Allowance", "Transportation"
        amount: Number,
        isRecurring: { type: Boolean, default: true }, // Applies every payroll period
        isMonthly: { type: Boolean, default: true }, // Or per cutoff
      },
    ],
    
    // Fixed Deductions (not government contributions)
    deductions: [
      {
        name: String, // e.g., "Loan repayment", "Union dues"
        amount: Number,
        isRecurring: { type: Boolean, default: true },
        startDate: Date,
        endDate: Date, // Null if ongoing
      },
    ],
    
    // Premium Pay Rates (multipliers)
    overtimeRate: { type: Number, default: 1.25 }, // 1.25x
    nightDifferentialRate: { type: Number, default: 1.10 }, // 1.10x
    specialHolidayRate: { type: Number, default: 1.30 }, // 1.30x (work day)
    regularHolidayRate: { type: Number, default: 2.00 }, // 2.00x (work day)
    sundayRestDayRate: { type: Number, default: 1.30 }, // 1.30x (if worked)
    
    // Tax Computation Settings
    taxFilingStatus: {
      type: String,
      enum: ['single', 'married', 'widowed', 'separated'],
      default: 'single',
    },
    numberOfDependents: { type: Number, default: 0 },
    
    // Tax Exemption Flag (for employees with tax exemption)
    isTaxExempt: {
      type: Boolean,
      default: false,
      description: 'If true, withholding tax will NOT be deducted from paycheck',
    },
    
    taxExemptionReason: {
      type: String,
      description: 'Reason for tax exemption (e.g., "Below minimum taxable income", "Government employee")',
    },
    
    taxExemptionStartDate: {
      type: Date,
      description: 'When the tax exemption starts (if applicable)',
    },
    
    taxExemptionEndDate: {
      type: Date,
      description: 'When the tax exemption ends (if applicable)',
    },
    
    // Status and Audit
    isActive: { type: Boolean, default: true },
    effectiveDate: { type: Date, default: Date.now },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      description: 'HR Staff/Head who last modified this config',
    },
    lastModifiedDate: { type: Date, default: Date.now },
    
    // Change History (keep for audit trail)
    changeHistory: [
      {
        fieldChanged: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

/**
 * PRE-SAVE HOOK: Validate and compute hourly rate
 */
employeeSalaryConfigSchema.pre('save', function (next) {
  // Ensure hourlyRate is computed
  if (!this.hourlyRate) {
    if (this.salaryType === 'daily_rate') {
      this.hourlyRate = this.dailyRate / 8; // Assuming 8-hour workday
    } else if (this.salaryType === 'monthly_rate' && this.monthlyRate) {
      // 26 working days * 8 hours = 208 hours per month
      this.hourlyRate = this.monthlyRate / 208;
    }
  }

  // Ensure monthlyRate is set if daily_rate provided
  if (this.salaryType === 'daily_rate' && !this.monthlyRate) {
    this.monthlyRate = this.dailyRate * 26;
  }

  // Ensure dailyRate is set if monthly_rate provided
  if (this.salaryType === 'monthly_rate' && !this.dailyRate) {
    this.dailyRate = this.monthlyRate / 26;
  }

  next();
});

/**
 * METHOD: Get total monthly allowances
 */
employeeSalaryConfigSchema.methods.getTotalAllowances = function () {
  return this.allowances
    .filter((a) => a.isRecurring && a.isMonthly)
    .reduce((sum, a) => sum + a.amount, 0);
};

/**
 * METHOD: Get total monthly deductions (excluding gov contributions)
 */
employeeSalaryConfigSchema.methods.getTotalDeductions = function () {
  const now = new Date();
  return this.deductions
    .filter((d) => d.isRecurring && (!d.endDate || d.endDate > now))
    .reduce((sum, d) => sum + d.amount, 0);
};

module.exports = mongoose.model('EmployeeSalaryConfig', employeeSalaryConfigSchema);
