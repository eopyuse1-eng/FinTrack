const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

// Enums
const EMPLOYMENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_LEAVE: 'on_leave',
  TERMINATED: 'terminated',
  RESIGNED: 'resigned',
};

const ROLES = {
  SEEDER_ADMIN: 'seeder_admin',
  SUPERVISOR: 'supervisor',
  HR_HEAD: 'hr_head',
  HR_STAFF: 'hr_staff',
  EMPLOYEE: 'employee',
};

const DEPARTMENTS = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  HR: 'hr',
  TREASURY: 'treasury',
  MARKETING: 'marketing',
};

const GENDERS = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
};

const MARITAL_STATUSES = {
  SINGLE: 'single',
  MARRIED: 'married',
  DIVORCED: 'divorced',
  WIDOWED: 'widowed',
};

// Employee schema
const employeeSchema = new mongoose.Schema(
  {
    // Personal Information
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      index: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
      default: null,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },

    // Contact Information
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // Don't include password by default in queries
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^[0-9\-\+]{7,15}$/, 'Invalid mobile number format'],
    },

    // Personal Details
    gender: {
      type: String,
      enum: {
        values: Object.values(GENDERS),
        message: 'Gender must be male, female, or other',
      },
      required: [true, 'Gender is required'],
    },
    birthdate: {
      type: Date,
      required: [true, 'Birthdate is required'],
    },
    birthplace: {
      type: String,
      trim: true,
      default: null,
    },
    maritalStatus: {
      type: String,
      enum: {
        values: Object.values(MARITAL_STATUSES),
        message: 'Marital status must be single, married, divorced, or widowed',
      },
      default: MARITAL_STATUSES.SINGLE,
    },

    // Address Information
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    municipality: {
      type: String,
      required: [true, 'Municipality is required'],
      trim: true,
    },
    province: {
      type: String,
      required: [true, 'Province is required'],
      trim: true,
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required'],
      trim: true,
      match: [/^[0-9]{4,6}$/, 'Invalid zip code format'],
    },

    // Work Information
    role: {
      type: String,
      enum: {
        values: Object.values(ROLES),
        message: 'Invalid role',
      },
      default: ROLES.EMPLOYEE,
      required: true,
    },
    department: {
      type: String,
      enum: {
        values: Object.values(DEPARTMENTS),
        message: 'Invalid department',
      },
      required: [true, 'Department is required'],
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true,
    },
    employmentStatus: {
      type: String,
      enum: {
        values: Object.values(EMPLOYMENT_STATUS),
        message: `Employment status must be one of: ${Object.values(EMPLOYMENT_STATUS).join(', ')}`,
      },
      default: EMPLOYMENT_STATUS.ACTIVE,
    },
    dateHired: {
      type: Date,
      required: [true, 'Date hired is required'],
    },

    // Government IDs
    sssNo: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allow null values to be unique
      match: [/^[0-9]{10}$/, 'SSS number must be 10 digits'],
      default: null,
    },
    tin: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      match: [/^[0-9]{12}$/, 'TIN must be 12 digits'],
      default: null,
    },
    philHealthNo: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      match: [/^[0-9]{12}$/, 'PhilHealth number must be 12 digits'],
      default: null,
    },
    hdmfId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      match: [/^[0-9]{12}$/, 'HDMF ID must be 12 digits'],
      default: null,
    },

    // Compensation Details
    monthlyRate: {
      type: Number,
      min: [0, 'Monthly rate cannot be negative'],
      default: 0,
    },
    dailyRate: {
      type: Number,
      min: [0, 'Daily rate cannot be negative'],
      default: 0,
    },
    hourlyRate: {
      type: Number,
      min: [0, 'Hourly rate cannot be negative'],
      default: 0,
    },
    isDailyPaid: {
      type: Boolean,
      default: false,
    },
    defaultWorkHoursPerDay: {
      type: Number,
      min: [0, 'Work hours cannot be negative'],
      default: 8,
    },

    // Allowances
    mealAllowance: {
      type: Number,
      min: [0, 'Meal allowance cannot be negative'],
      default: 0,
    },
    transportAllowance: {
      type: Number,
      min: [0, 'Transport allowance cannot be negative'],
      default: 0,
    },
    otherAllowance: {
      type: Number,
      min: [0, 'Other allowance cannot be negative'],
      default: 0,
    },

    // Emergency Contact
    emergencyContactName: {
      type: String,
      trim: true,
      default: null,
    },
    emergencyContactPhone: {
      type: String,
      trim: true,
      match: [/^[0-9\-\+]{7,15}$/, 'Invalid phone number format'],
      default: null,
    },

    // Audit Fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy is required'],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Pre-save hook: Hash password and generate full name
employeeSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    // Generate full name if not already set
    if (!this.name) {
      this.name = `${this.firstName} ${this.middleName ? this.middleName + ' ' : ''}${this.lastName}`.trim();
    }
    return next();
  }

  try {
    // Generate full name
    this.name = `${this.firstName} ${this.middleName ? this.middleName + ' ' : ''}${this.lastName}`.trim();

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Hide password when converting to JSON
employeeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Instance method: Compare password during login
employeeSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

// Instance method: Calculate total monthly compensation
employeeSchema.methods.getTotalMonthlyCompensation = function () {
  return (
    this.monthlyRate +
    this.mealAllowance +
    this.transportAllowance +
    this.otherAllowance
  );
};

// Instance method: Generate JWT token for employee
employeeSchema.methods.generateAuthToken = function () {
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    {
      id: this._id,
      email: this.email,
      name: this.name,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      department: this.department,
      position: this.position,
      employmentStatus: this.employmentStatus,
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
  return token;
};

// Static method: Calculate age from birthdate
employeeSchema.methods.getAge = function () {
  const today = new Date();
  let age = today.getFullYear() - this.birthdate.getFullYear();
  const monthDiff = today.getMonth() - this.birthdate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.birthdate.getDate())) {
    age--;
  }

  return age;
};

// Static method: Calculate years of service
employeeSchema.methods.getYearsOfService = function () {
  const today = new Date();
  let years = today.getFullYear() - this.dateHired.getFullYear();
  const monthDiff = today.getMonth() - this.dateHired.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.dateHired.getDate())) {
    years--;
  }

  return years;
};

// Virtual: Calculated daily rate from monthly rate
employeeSchema.virtual('calculatedDailyRate').get(function () {
  if (this.monthlyRate > 0) {
    return this.monthlyRate / 22; // Assuming 22 working days per month
  }
  return this.dailyRate;
});

// Virtual: Calculated hourly rate from daily rate
employeeSchema.virtual('calculatedHourlyRate').get(function () {
  const dailyRate = this.calculatedDailyRate;
  if (dailyRate > 0) {
    return dailyRate / this.defaultWorkHoursPerDay;
  }
  return this.hourlyRate;
});

// Index for frequently queried fields
employeeSchema.index({ department: 1, employmentStatus: 1 });
employeeSchema.index({ email: 1 });
employeeSchema.index({ position: 1 });
employeeSchema.index({ dateHired: 1 });

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
module.exports.EMPLOYMENT_STATUS = EMPLOYMENT_STATUS;
module.exports.ROLES = ROLES;
module.exports.DEPARTMENTS = DEPARTMENTS;
module.exports.GENDERS = GENDERS;
module.exports.MARITAL_STATUSES = MARITAL_STATUSES;
