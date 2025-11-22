const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

// User roles in the HRIS system hierarchy
const ROLES = {
  SEEDER_ADMIN: 'seeder_admin', // Creates supervisors
  SUPERVISOR: 'supervisor', // Creates HR heads
  HR_HEAD: 'hr_head', // Creates HR staff and employees
  HR_STAFF: 'hr_staff', // Manages employees within department
  EMPLOYEE: 'employee', // Regular employee
};

// Departments
const DEPARTMENTS = {
  ADMIN: 'admin',       // For Seeder Admin and HR Head
  SUPERVISOR: 'supervisor', // For Supervisor role
  HR: 'hr',
  TREASURY: 'treasury',
  MARKETING: 'marketing',
};

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
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
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.EMPLOYEE,
      required: true,
    },
    department: {
      type: String,
      enum: Object.values(DEPARTMENTS),
      required: true, // All users must have a department
    },
    // Email verification via Gmail OAuth
    isEmailVerified: {
      type: Boolean,
      default: false, // Requires Gmail OAuth verification first
    },
    // Google OAuth ID
    googleId: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Seeder Admin is disabled after first Supervisor is created
    isDisabled: {
      type: Boolean,
      default: false, // Seeder Admin gets disabled after initialization
    },
    disabledAt: {
      type: Date,
      default: null,
    },
    disabledReason: {
      type: String,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    // Account unlock request system
    unlockRequest: {
      type: Boolean,
      default: false, // Flag if user has a pending unlock request
    },
    unlockReason: {
      type: String,
      default: null, // Reason for unlock request
    },
    unlockRequestedAt: {
      type: Date,
      default: null, // When the unlock was requested
    },
    // Hierarchy tracking
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Who created this user
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Direct supervisor
    },
    // Personal Information
    middleName: String,
    gender: {
      type: String,
      enum: {
        values: ['male', 'female', 'other', ''],
        message: 'Gender must be male, female, other, or empty'
      },
      default: '',
    },
    birthdate: Date,
    birthplace: String,
    maritalStatus: {
      type: String,
      enum: {
        values: ['single', 'married', 'divorced', 'widowed', ''],
        message: 'Marital status must be single, married, divorced, widowed, or empty'
      },
      default: '',
    },
    mobileNumber: String,
    // Address
    address: String,
    city: String,
    municipality: String,
    province: String,
    zipCode: String,
    // Employment
    position: String,
    dateHired: Date,
    employmentStatus: {
      type: String,
      default: 'active',
    },
    // Government IDs
    sssNo: String,
    tin: String,
    philHealthNo: String,
    hdmfId: String,
    // Emergency Contact
    emergencyContactName: String,
    emergencyContactPhone: String,
    // Leave Management
    annualLeaveBalance: {
      type: Number,
      default: 15, // 15 days per year
    },
    leaveBalanceResetDate: {
      type: Date,
      default: () => {
        // Set to end of current year
        const now = new Date();
        return new Date(now.getFullYear(), 11, 31);
      },
    },
  },
  {
    timestamps: true,
  }
);

// Convert empty strings to null for optional enum fields
userSchema.pre('save', function (next) {
  // Convert empty strings to null for optional fields
  if (this.gender === '') this.gender = null;
  if (this.maritalStatus === '') this.maritalStatus = null;
  
  next();
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcryptjs.genSalt(8); // Reduced from 10 to 8 for faster hashing
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords during login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function () {
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.role,
      firstName: this.firstName,
      lastName: this.lastName,
      department: this.department,
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
  return token;
};

// Method to check if account is locked
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > new Date();
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = async function () {
  // Reset attempts if lock period has expired
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  // Increment attempts and lock if threshold reached (5 attempts)
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 15 * 60 * 1000; // 15 minutes

  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + lockTime) };
  }

  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { loginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 },
  });
};

const User = mongoose.model('User', userSchema);

module.exports = { User, ROLES, DEPARTMENTS };

