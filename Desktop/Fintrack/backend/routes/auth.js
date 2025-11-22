const express = require('express');
const { User, ROLES, DEPARTMENTS } = require('../models/User');
const { AuditLog, LOG_TYPES } = require('../models/AuditLog');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const { rateLimitMiddleware } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

/**
 * Helper function to log audit events
 */
const logAuditEvent = async (userId, email, action, status = 'success', reason = null, req = null) => {
  try {
    await AuditLog.create({
      userId,
      email,
      action,
      status,
      reason,
      ipAddress: req?.ip || null,
      userAgent: req?.get('user-agent') || null,
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
};

/**
 * POST /api/auth/register
 * Role-based user registration following hierarchy:
 * - SEEDER_ADMIN can create SUPERVISOR
 * - SUPERVISOR can create HR_HEAD
 * - HR_HEAD can create HR_STAFF and EMPLOYEE
 */
router.post('/register', authMiddleware, async (req, res) => {
  try {
    const { 
      firstName, lastName, email, password, role, department,
      middleName, gender, birthdate, birthplace, maritalStatus,
      mobileNumber, address, city, municipality, province, zipCode,
      position, dateHired, sssNo, tin, philHealthNo, hdmfId,
      emergencyContactName, emergencyContactPhone
    } = req.body;
    const currentUser = req.user;

    // Validate input
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate role
    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ message: `Invalid role. Allowed roles: ${Object.values(ROLES).join(', ')}` });
    }

    // Check registration hierarchy
    let isAllowed = false;
    let allowedRoles = [];

    if (currentUser.role === ROLES.SEEDER_ADMIN) {
      // Seeder admin can only create supervisors
      if (role === ROLES.SUPERVISOR) {
        isAllowed = true;
        allowedRoles = [ROLES.SUPERVISOR];
      }
    } else if (currentUser.role === ROLES.SUPERVISOR) {
      // Supervisor can only create HR heads
      if (role === ROLES.HR_HEAD) {
        isAllowed = true;
        allowedRoles = [ROLES.HR_HEAD];
      }
    } else if (currentUser.role === ROLES.HR_HEAD) {
      // HR head can create HR staff and employees
      if ([ROLES.HR_STAFF, ROLES.EMPLOYEE].includes(role)) {
        isAllowed = true;
        allowedRoles = [ROLES.HR_STAFF, ROLES.EMPLOYEE];
      }
    }

    if (!isAllowed) {
      return res.status(403).json({
        message: `Your role (${currentUser.role}) cannot create users with role (${role}). Allowed roles to create: ${allowedRoles.join(', ')}`,
      });
    }

    // Validate department for employees
    if (role === ROLES.EMPLOYEE && !department) {
      return res.status(400).json({ message: 'Department is required for employees' });
    }

    if (role === ROLES.EMPLOYEE && !Object.values(DEPARTMENTS).includes(department)) {
      return res.status(400).json({ message: `Invalid department. Allowed: ${Object.values(DEPARTMENTS).join(', ')}` });
    }

    // Assign department based on role
    let assignedDepartment;
    if (role === ROLES.SEEDER_ADMIN) {
      assignedDepartment = DEPARTMENTS.ADMIN;
    } else if (role === ROLES.SUPERVISOR) {
      assignedDepartment = DEPARTMENTS.SUPERVISOR;
    } else if (role === ROLES.HR_STAFF || role === ROLES.HR_HEAD) {
      assignedDepartment = DEPARTMENTS.HR;
    } else if (role === ROLES.EMPLOYEE) {
      assignedDepartment = department;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      middleName: middleName || null,
      gender: gender || '',
      birthdate: birthdate ? new Date(birthdate) : null,
      birthplace: birthplace || null,
      maritalStatus: maritalStatus || '',
      mobileNumber: mobileNumber || null,
      address: address || null,
      city: city || null,
      municipality: municipality || null,
      province: province || null,
      zipCode: zipCode || null,
      position: position || null,
      dateHired: dateHired ? new Date(dateHired) : null,
      sssNo: sssNo || null,
      tin: tin || null,
      philHealthNo: philHealthNo || null,
      hdmfId: hdmfId || null,
      emergencyContactName: emergencyContactName || null,
      emergencyContactPhone: emergencyContactPhone || null,
      email: email.toLowerCase(),
      password,
      role,
      department: assignedDepartment,
      createdBy: currentUser.id,
      supervisor: currentUser.id, // Set current user as supervisor/creator
      // Initialize leave balance
      annualLeaveBalance: 15,
      leaveBalanceResetDate: new Date(new Date().getFullYear(), 11, 31),
    });

    await newUser.save();

    console.log('✅ New user created:', {
      name: `${newUser.firstName} ${newUser.lastName}`,
      email: newUser.email,
      birthdate: newUser.birthdate,
      role: newUser.role,
      department: newUser.department
    });

    // Log audit event
    await logAuditEvent(newUser._id, newUser.email, LOG_TYPES.REGISTRATION, 'success', null, req);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        isActive: newUser.isActive,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error during registration', error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Login endpoint - Returns JWT token
 * Rate limited to 5 attempts per minute
 * Frontend: Store returned token in localStorage
 * Usage: axios.post('http://localhost:5000/api/auth/login', { email, password })
 */
router.post('/login', rateLimitMiddleware(5, 60 * 1000), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email (include password field for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      // Log failed login attempt
      await logAuditEvent(null, email, LOG_TYPES.FAILED_LOGIN, 'failed', 'User not found', req);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is locked due to too many failed attempts
    if (user.isLocked()) {
      const timeRemaining = Math.ceil((user.lockUntil - new Date()) / 1000);
      await logAuditEvent(user._id, user.email, LOG_TYPES.ACCOUNT_LOCKED, 'failed', `Account locked for ${timeRemaining}s`, req);
      return res.status(401).json({
        message: `Account is locked. Try again in ${timeRemaining} seconds.`,
        locked: true,
      });
    }

    // Check if user is active
    if (!user.isActive) {
      await logAuditEvent(user._id, user.email, LOG_TYPES.FAILED_LOGIN, 'failed', 'User account inactive', req);
      return res.status(401).json({ message: 'Your account has been deactivated' });
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      await logAuditEvent(user._id, user.email, LOG_TYPES.FAILED_LOGIN, 'failed', 'Invalid password', req);

      const attemptsLeft = 5 - (user.loginAttempts + 1);
      return res.status(401).json({
        message: attemptsLeft > 0 ? `Invalid password. ${attemptsLeft} attempts remaining.` : 'Account locked due to too many failed attempts',
      });
    }

    // Password is correct - reset login attempts and generate token
    await user.resetLoginAttempts();

    const token = user.generateAuthToken();

    // Log successful login
    await logAuditEvent(user._id, user.email, LOG_TYPES.LOGIN, 'success', null, req);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login', error: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Logout endpoint - Requires authentication
 * Frontend: Remove token from localStorage and redirect to login
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Log logout event
    await logAuditEvent(req.user.id, req.user.email, LOG_TYPES.LOGOUT, 'success', null, req);

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error during logout' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info including leave balance
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    // Check if leave balance needs to be reset (end of year)
    const now = new Date();
    if (user.leaveBalanceResetDate && user.leaveBalanceResetDate < now) {
      // Reset balance to 15 and set new reset date
      user.annualLeaveBalance = 15;
      user.leaveBalanceResetDate = new Date(now.getFullYear() + 1, 11, 31);
      await user.save();
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user info',
      error: error.message,
    });
  }
});

/**
 * GET /api/auth/users
 * Get users based on role hierarchy:
 * - SEEDER_ADMIN: See all supervisors
 * - SUPERVISOR: See all HR heads they created
 * - HR_HEAD: See HR staff and employees they created
 */
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const skip = (page - 1) * limit;
    const currentUser = req.user;

    let query = { isActive: true };

    // Build query based on role hierarchy
    if (currentUser.role === ROLES.SEEDER_ADMIN) {
      query.role = ROLES.SUPERVISOR; // Seeder admin sees supervisors
    } else if (currentUser.role === ROLES.SUPERVISOR) {
      query.createdBy = currentUser.id; // Supervisor sees HR heads they created
      query.role = ROLES.HR_HEAD;
    } else if (currentUser.role === ROLES.HR_HEAD) {
      query.createdBy = currentUser.id; // HR head sees users they created
      query.role = { $in: [ROLES.HR_STAFF, ROLES.EMPLOYEE] };
    } else {
      return res.status(403).json({ message: 'Unauthorized to view users' });
    }

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

/**
 * GET /api/auth/audit-logs
 * Get audit logs (SEEDER_ADMIN only)
 */
router.get('/audit-logs', authMiddleware, roleMiddleware([ROLES.SEEDER_ADMIN]), async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const skip = (page - 1) * limit;
    const action = req.query.action || null;

    const filter = {};
    if (action) {
      filter.action = action;
    }

    const logs = await AuditLog.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await AuditLog.countDocuments(filter);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
});

/**
 * PUT /api/auth/update-profile
 * Update user profile information
 */
router.put('/update-profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Define allowed fields for updating
    const allowedFields = [
      'firstName',
      'lastName',
      'middleName',
      'mobileNumber',
      'gender',
      'birthdate',
      'birthplace',
      'maritalStatus',
      'address',
      'city',
      'municipality',
      'province',
      'zipCode',
      'position',
      'dateHired',
      'sssNo',
      'tin',
      'philHealthNo',
      'hdmfId',
      'emergencyContactName',
      'emergencyContactPhone',
    ];

    // Filter updates to only allowed fields
    const filteredUpdates = {};
    allowedFields.forEach(field => {
      if (updates.hasOwnProperty(field) && updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log audit event
    await logAuditEvent(userId, updatedUser.email, LOG_TYPES.REGISTRATION, 'success', 'Profile updated', req);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Find user with password field
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      await logAuditEvent(userId, user.email, LOG_TYPES.FAILED_LOGIN, 'failed', 'Invalid current password for password change', req);
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log audit event
    await logAuditEvent(userId, user.email, LOG_TYPES.REGISTRATION, 'success', 'Password changed', req);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
});

/**
 * GET /api/auth/subordinates
 * Fetch all users created by current user (subordinates)
 * Returns HR Staff and Employees created by supervisor/hr_head
 * Protected route - requires authentication
 */
router.get('/subordinates', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all users created by the current user
    const subordinates = await User.find({ createdBy: userId })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Subordinates retrieved successfully',
      subordinates,
      total: subordinates.length,
    });
  } catch (error) {
    console.error('Error fetching subordinates:', error);
    res.status(500).json({ message: 'Error fetching subordinates', error: error.message });
  }
});

/**
 * PUT /api/auth/users/:id
 * Update a subordinate user (manager updates employee profile)
 * Role hierarchy:
 * - HR_HEAD can update HR_STAFF and EMPLOYEE they created
 * - SUPERVISOR can update HR_HEAD they created
 * - SEEDER_ADMIN can update SUPERVISOR they created
 */
router.put('/users/:id', authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUser = req.user;
    const updates = req.body;

    // Find the target user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current user can update this user (must be the creator/supervisor)
    if (targetUser.createdBy.toString() !== currentUser.id.toString()) {
      return res.status(403).json({
        message: 'You do not have permission to update this user',
      });
    }

    // Define allowed fields for updating
    const allowedFields = [
      'firstName',
      'lastName',
      'middleName',
      'mobileNumber',
      'gender',
      'birthDate',
      'birthplace',
      'maritalStatus',
      'address',
      'city',
      'municipality',
      'province',
      'zipCode',
      'position',
      'dateHired',
      'sssNo',
      'tin',
      'philHealthNo',
      'hdmfId',
      'emergencyContactName',
      'emergencyContactPhone',
    ];

    // Filter updates to only allowed fields
    const filteredUpdates = {};
    allowedFields.forEach(field => {
      if (updates.hasOwnProperty(field) && updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    // Update target user
    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    ).select('-password');

    // Log audit event
    await logAuditEvent(
      currentUser.id,
      currentUser.email,
      LOG_TYPES.REGISTRATION,
      'success',
      `Updated user: ${targetUser.firstName} ${targetUser.lastName}`,
      req
    );

    res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

/**
 * GET /api/auth/all-employees
 * Fetch all employees with birthdays for calendar
 * Restricted to HR Head, HR Staff, Supervisors, and Employees
 * Protected route - requires authentication
 */
router.get('/all-employees', authMiddleware, async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Allow HR Head, HR Staff, Supervisor, and Employees to access
    const allowedRoles = ['hr_head', 'hr_staff', 'supervisor', 'employee'];
    if (!allowedRoles.includes(currentUser.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all users with birthdate
    const employees = await User.find({ 
      birthdate: { $exists: true, $ne: null },
      isActive: true 
    })
      .select('firstName lastName birthdate email department role')
      .sort({ firstName: 1 });

    console.log('📅 Fetching employees with birthdate:');
    console.log('Query: { birthdate: { $exists: true, $ne: null }, isActive: true }');
    console.log(`Found: ${employees.length} employees`);
    if (employees.length > 0) {
      console.log('Employees:', employees.map(e => ({
        name: `${e.firstName} ${e.lastName}`,
        birthdate: e.birthdate,
        department: e.department
      })));
    }

    res.json({
      message: 'All employees retrieved successfully',
      employees,
      total: employees.length,
    });
  } catch (error) {
    console.error('Error fetching all employees:', error);
    res.status(500).json({ message: 'Error fetching all employees', error: error.message });
  }
});

/**
 * GET /api/auth/employees-for-evaluation
 * Fetch all active employees for performance evaluation form
 * Returns employee _id, firstName, lastName, position, department
 * Restricted to HR Head, HR Staff, and Supervisors
 * Protected route - requires authentication
 */
router.get('/employees-for-evaluation', authMiddleware, async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Allow HR Head, HR Staff, Supervisor to access
    const allowedRoles = ['hr_head', 'hr_staff', 'supervisor'];
    if (!allowedRoles.includes(currentUser.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all active users
    const employees = await User.find({ isActive: true })
      .select('_id firstName lastName position department role')
      .sort({ firstName: 1, lastName: 1 });

    res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error('Error fetching employees for evaluation:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching employees', 
      error: error.message 
    });
  }
});

/**
 * POST /api/auth/request-unlock
 * File an account unlock request when locked out
 * No auth required - user is locked out
 */
router.post('/request-unlock', async (req, res) => {
  const authController = require('../controllers/authController');
  authController.requestUnlock(req, res);
});

/**
 * GET /api/auth/account-status/:email
 * Check if account is locked (for login page)
 * No auth required - used during login process
 */
router.get('/account-status/:email', async (req, res) => {
  const authController = require('../controllers/authController');
  authController.getAccountStatus(req, res);
});

/**
 * GET /api/auth/unlock-requests
 * Get all pending unlock requests (HR Head only)
 */
router.get('/unlock-requests', authMiddleware, roleMiddleware(['HR_HEAD', 'hr_head']), async (req, res) => {
  const authController = require('../controllers/authController');
  authController.getUnlockRequests(req, res);
});

/**
 * POST /api/auth/unlock/:id
 * Approve and process unlock request (HR Head only)
 * Body: { comment?: string, resetPassword?: boolean }
 */
router.post('/unlock/:id', authMiddleware, roleMiddleware(['HR_HEAD', 'hr_head']), async (req, res) => {
  const authController = require('../controllers/authController');
  authController.approveUnlock(req, res);
});

/**
 * POST /api/auth/unlock/:id/deny
 * Deny unlock request (HR Head only)
 * Body: { comment?: string }
 */
router.post('/unlock/:id/deny', authMiddleware, roleMiddleware(['HR_HEAD', 'hr_head']), async (req, res) => {
  const authController = require('../controllers/authController');
  authController.denyUnlock(req, res);
});

/**
 * POST /api/auth/send-verification-code
 * Generate and send 6-digit verification code to user's email
 * User must have verified via Google OAuth first (isEmailVerified = true)
 * Code is valid for 10 minutes
 * 
 * Usage after OAuth:
 * 1. User selects "Sign in with Email" option instead of Google
 * 2. Frontend calls: POST /api/auth/send-verification-code { email }
 * 3. System sends 6-digit code to their email
 * 4. User enters code and emails to POST /api/auth/verify-code-login
 */
router.post('/send-verification-code', async (req, res) => {
  const authController = require('../controllers/authController');
  authController.sendVerificationCode(req, res);
});

/**
 * POST /api/auth/verify-code-login
 * Verify code and authenticate user
 * User submits email + code received via email
 * Returns JWT token if code is valid
 * 
 * Used after initial Google OAuth verification
 * Allows user to login with email+code instead of Google repeatedly
 */
router.post('/verify-code-login', async (req, res) => {
  const authController = require('../controllers/authController');
  authController.verifyCodeLogin(req, res);
});

module.exports = router;

