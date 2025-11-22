/**
 * Authentication Controller
 * Handles login, OAuth, and user creation with verification gates
 */

const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { AuditLog } = require('../models/AuditLog');
const { VerificationCode } = require('../models/VerificationCode');
const authUtils = require('../utils/authUtils');
const passwordUtils = require('../utils/passwordUtils');

/**
 * POST /auth/login
 * Local login with verification gate
 * - Requires isEmailVerified = true OR user is demo seed
 */
exports.login = async (req, res) => {
  const startTime = Date.now();
  console.log('🔐 LOGIN REQUEST RECEIVED:', req.body);
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    console.log(`📧 Looking up user: ${email}`);
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    console.timeEnd(`Login - DB Query for ${email}`);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 🔐 CHECK IF ACCOUNT IS DISABLED (Seeder Admin after initialization)
    if (user.isDisabled) {
      return res.status(403).json({
        success: false,
        message: `Account disabled: ${user.disabledReason}`,
        code: 'ACCOUNT_DISABLED',
      });
    }

    // ⛔ CHECK IF ACCOUNT IS LOCKED
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is locked due to too many failed login attempts',
        code: 'ACCOUNT_LOCKED',
        lockUntil: user.lockUntil,
        canRequestUnlock: true,
      });
    }

    // ⛔ VERIFICATION GATE: Check if user can use local login
    const canLogin = authUtils.canUseLocalLogin(user);
    if (!canLogin.allowed) {
      return res.status(403).json({
        success: false,
        message: canLogin.message,
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // Verify password - THIS IS THE BOTTLENECK
    console.time(`Password Comparison for ${email}`);
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    console.timeEnd(`Password Comparison for ${email}`);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update last login (async, don't wait)
    user.lastLogin = new Date();
    user.loginAttempts = 0;
    user.save().catch(err => console.error('Error updating user:', err));

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        department: user.department,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const totalTime = Date.now() - startTime;
    console.log(`✓ Login successful for ${email} (${totalTime}ms)`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};

/**
 * GET /auth/google
 * Initiate Google OAuth login
 * Frontend redirects to this, which redirects to Google
 */
exports.googleAuth = (req, res) => {
  // Passport will handle the redirect to Google
  // This is a placeholder - actual handling is in routes
  res.status(200).json({
    success: true,
    message: 'Redirecting to Google OAuth...',
  });
};

/**
 * GET /auth/google/callback
 * Google OAuth callback - handled by Passport
 * Sets isEmailVerified = true and creates/updates user
 * After verification, redirects to dashboard
 */
exports.googleAuthCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Google authentication failed',
      });
    }

    const user = req.user;

    // ✅ EMAIL VERIFICATION: Set isEmailVerified = true when user completes Google OAuth
    // This allows them to now login with email+code authentication method
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      await user.save();
      console.log(`✅ EMAIL VERIFIED via Google OAuth: ${user.email}`);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        department: user.department,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Log successful OAuth login
    await AuditLog.create({
      user: user._id,
      action: 'LOGIN_GOOGLE_SUCCESS',
      details: `${user.firstName} ${user.lastName} logged in via Gmail OAuth. Email verified.`,
      timestamp: new Date(),
    });

    // Redirect to frontend dashboard with token
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendURL}/dashboard?token=${token}`);
  } catch (error) {
    console.error('Google callback error:', error);
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendURL}/login?error=google_auth_failed&message=${encodeURIComponent(error.message)}`);
  }
};

/**
 * POST /auth/users/create
 * Create new user with role-based hierarchy
 * - Seeder Admin creates Supervisors
 * - Supervisors create HR Heads
 * - HR Heads create HR Staff & Employees
 */
exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, department } = req.body;
    const creatorId = req.user.id;
    const creatorRole = req.user.role;

    // Validate input
    if (!firstName || !lastName || !email || !password || !role || !department) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Check creation permissions
    const canCreate = authUtils.canCreateUser(creatorRole, role);
    if (!canCreate.allowed) {
      return res.status(403).json({
        success: false,
        message: canCreate.message,
      });
    }

    // 🔐 PASSWORD VALIDATION
    // Different validation levels for different roles
    let passwordValidation;
    if (role === 'seeder_admin') {
      // Seeder Admin requires STRICT password validation
      passwordValidation = passwordUtils.validateSeederAdminPassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Seeder Admin password does not meet security requirements',
          code: 'WEAK_PASSWORD',
          errors: passwordValidation.errors,
        });
      }
    } else {
      // Other roles require standard password validation
      passwordValidation = passwordUtils.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet minimum security requirements',
          code: 'WEAK_PASSWORD',
          errors: passwordValidation.errors,
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create new user
    // IMPORTANT EMAIL VERIFICATION LOGIC:
    // - Demo accounts (@company.com) = isEmailVerified TRUE (hardcoded, can login immediately)
    // - Real email accounts = isEmailVerified FALSE (must verify via Google OAuth first)
    // - After Google OAuth callback, isEmailVerified set to TRUE
    // - Then user can choose: Google OAuth again OR Email+Code authentication
    
    const isDemoEmail = [
      'maria.santos@company.com',
      'juan.cruz@company.com',
      'joshua.marcelino@company.com',
      'lj.tanauan@company.com',
      'ana.garcia@company.com',
    ].includes(email.toLowerCase());

    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      department,
      createdBy: creatorId,
      // Demo emails get auto-verified for payroll demo (no OAuth needed)
      // Real emails must verify via Google OAuth first
      isEmailVerified: isDemoEmail ? true : false,
    });

    await newUser.save();

    // 🔐 AUTO-DISABLE SEEDER ADMIN: If creating first Supervisor, disable Seeder Admin
    if (role === 'supervisor') {
      const seederAdmin = await User.findOne({ role: 'seeder_admin' });
      if (seederAdmin && !seederAdmin.isDisabled) {
        // Disable Seeder Admin after first Supervisor is created
        seederAdmin.isDisabled = true;
        seederAdmin.disabledAt = new Date();
        seederAdmin.disabledReason = 'System initialized - First Supervisor created';
        await seederAdmin.save();

        // Log the disable action
        await AuditLog.create({
          user: seederAdmin._id,
          action: 'SEEDER_ADMIN_DISABLED',
          details: 'Seeder Admin automatically disabled after first Supervisor creation',
          timestamp: new Date(),
        });

        console.log('🔐 SEEDER ADMIN DISABLED: System initialized with first Supervisor');
      }
    }

    // Log user creation
    await AuditLog.create({
      user: creatorId,
      action: 'USER_CREATED',
      targetUser: newUser._id,
      details: `Created ${role} user: ${firstName} ${lastName} (${email})`,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: `${role} user created successfully`,
      data: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        isEmailVerified: newUser.isEmailVerified,
        loginNote: !newUser.isEmailVerified 
          ? 'User must verify Gmail via "Sign in with Google" before using local login'
          : 'User can login with email/password immediately',
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'User creation failed',
      error: error.message,
    });
  }
};

/**
 * POST /auth/verify-email
 * Check if email needs verification
 * Used by frontend to conditionally show "Sign in with Google" prompt
 */
exports.checkEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      isEmailVerified: user.isEmailVerified,
      message: user.isEmailVerified 
        ? 'Email verified - local login allowed'
        : 'Email not verified - must use "Sign in with Google" first',
    });
  } catch (error) {
    console.error('Check verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification check failed',
      error: error.message,
    });
  }
};

/**
 * POST /auth/request-unlock
 * File an account unlock request when locked out
 */
exports.requestUnlock = async (req, res) => {
  try {
    const { email, reason } = req.body;

    if (!email || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Email and reason are required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is actually locked
    if (!user.isLocked()) {
      return res.status(400).json({
        success: false,
        message: 'Account is not locked',
      });
    }

    // Check if already has pending unlock request
    if (user.unlockRequest) {
      return res.status(400).json({
        success: false,
        message: 'Unlock request already pending',
      });
    }

    // Create unlock request record
    const UnlockRequest = require('../models/UnlockRequest');
    const unlockRecord = new UnlockRequest({
      user: user._id,
      reason: reason.substring(0, 500), // Limit to 500 chars
    });

    await unlockRecord.save();

    // Mark user as having pending unlock request
    user.unlockRequest = true;
    user.unlockReason = reason.substring(0, 500);
    user.unlockRequestedAt = new Date();
    await user.save();

    // Log the action
    const { AuditLog } = require('../models/AuditLog');
    await AuditLog.create({
      userId: user._id,
      action: 'ACCOUNT_UNLOCK_REQUESTED',
      details: `Unlock requested. Reason: ${reason}`,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Unlock request submitted successfully',
      unlockRequestId: unlockRecord._id,
    });
  } catch (error) {
    console.error('Request unlock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit unlock request',
      error: error.message,
    });
  }
};

/**
 * GET /auth/unlock-requests
 * Get all pending unlock requests (HR Head only)
 */
exports.getUnlockRequests = async (req, res) => {
  try {
    const UnlockRequest = require('../models/UnlockRequest');
    
    // Get all unlock requests with user details
    const requests = await UnlockRequest.find()
      .populate('user', 'email firstName lastName department isLocked')
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error('Get unlock requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unlock requests',
      error: error.message,
    });
  }
};

/**
 * POST /auth/unlock/:id
 * Approve and process unlock request (HR Head only)
 * Optionally resets password
 */
exports.approveUnlock = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, resetPassword } = req.body;
    const hrHeadId = req.userId; // From auth middleware

    const UnlockRequest = require('../models/UnlockRequest');
    const unlockRequest = await UnlockRequest.findById(id).populate('user');

    if (!unlockRequest) {
      return res.status(404).json({
        success: false,
        message: 'Unlock request not found',
      });
    }

    if (unlockRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve - request is already ${unlockRequest.status}`,
      });
    }

    const user = unlockRequest.user;

    // Unlock the account
    user.loginAttempts = 0;
    user.unlockRequest = false;
    user.unlockReason = null;
    user.unlockRequestedAt = null;
    user.lockUntil = null; // Remove lock

    // Reset password if requested
    if (resetPassword) {
      const tempPassword = require('crypto').randomBytes(8).toString('hex');
      const hashedPassword = await bcryptjs.hash(tempPassword, 10);
      user.password = hashedPassword;
      user.passwordResetRequired = true; // Notify user to reset
    }

    await user.save();

    // Update unlock request record
    unlockRequest.status = 'approved';
    unlockRequest.reviewedBy = hrHeadId;
    unlockRequest.reviewComment = comment || null;
    unlockRequest.passwordReset = resetPassword || false;
    unlockRequest.reviewedAt = new Date();
    await unlockRequest.save();

    // Log the action
    const { AuditLog } = require('../models/AuditLog');
    await AuditLog.create({
      userId: hrHeadId,
      targetUserId: user._id,
      action: 'ACCOUNT_UNLOCK_APPROVED',
      details: `Unlock approved by HR Head. ${resetPassword ? 'Password reset.' : ''}${comment ? ` Comment: ${comment}` : ''}`,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Account unlocked successfully',
      unlockRequest: unlockRequest,
      tempPassword: resetPassword ? tempPassword : null,
    });
  } catch (error) {
    console.error('Approve unlock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve unlock request',
      error: error.message,
    });
  }
};

/**
 * POST /auth/unlock/:id/deny
 * Deny unlock request (HR Head only)
 */
exports.denyUnlock = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const hrHeadId = req.userId; // From auth middleware

    const UnlockRequest = require('../models/UnlockRequest');
    const unlockRequest = await UnlockRequest.findById(id).populate('user');

    if (!unlockRequest) {
      return res.status(404).json({
        success: false,
        message: 'Unlock request not found',
      });
    }

    if (unlockRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot deny - request is already ${unlockRequest.status}`,
      });
    }

    const user = unlockRequest.user;

    // Mark user's unlock request as reviewed but not unlocked
    user.unlockRequest = false;
    user.unlockRequestedAt = null;
    await user.save();

    // Update unlock request record
    unlockRequest.status = 'denied';
    unlockRequest.reviewedBy = hrHeadId;
    unlockRequest.reviewComment = comment || null;
    unlockRequest.reviewedAt = new Date();
    await unlockRequest.save();

    // Log the action
    const { AuditLog } = require('../models/AuditLog');
    await AuditLog.create({
      userId: hrHeadId,
      targetUserId: user._id,
      action: 'ACCOUNT_UNLOCK_DENIED',
      details: `Unlock request denied by HR Head.${comment ? ` Reason: ${comment}` : ''}`,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Unlock request denied',
      unlockRequest: unlockRequest,
    });
  } catch (error) {
    console.error('Deny unlock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deny unlock request',
      error: error.message,
    });
  }
};

/**
 * GET /auth/account-status/:email
 * Check if account is locked (for login page)
 */
exports.getAccountStatus = async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      isLocked: user.isLocked(),
      lockUntil: user.lockUntil,
      hasUnlockRequest: user.unlockRequest,
    });
  } catch (error) {
    console.error('Get account status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check account status',
      error: error.message,
    });
  }
};

/**
 * POST /auth/send-verification-code
 * Generate and send 6-digit code to user's email
 * User must have already verified via Google OAuth (isEmailVerified = true)
 * Code is valid for 10 minutes
 * 
 * Request body: { email }
 * Response: { success: true, message: 'Code sent to email' }
 */
exports.sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user has verified via Google OAuth
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email via Google OAuth first',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Determine the full URL for email link (in development, localhost:5000)
    const verificationUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/auth/verify-code?email=${encodeURIComponent(email)}&code=${code}`;

    // Store code in database (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    await VerificationCode.create({
      user: user._id,
      email: email.toLowerCase(),
      code: code,
      expiresAt: expiresAt,
    });

    // TODO: Send email with code (currently console.log for development)
    console.log(`📧 VERIFICATION CODE FOR ${email}: ${code} (expires in 10 min)`);
    console.log(`🔗 Verification URL: ${verificationUrl}`);

    // In production, integrate with email service (SendGrid, Nodemailer, etc.)
    // For now, return success to frontend
    res.status(200).json({
      success: true,
      message: `Verification code sent to ${email}`,
      // For development/demo: show the code (remove in production)
      code: process.env.NODE_ENV === 'development' ? code : undefined,
    });
  } catch (error) {
    console.error('Send verification code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code',
      error: error.message,
    });
  }
};

/**
 * POST /auth/verify-code-login
 * Verify code and allow login
 * User enters: email + code received via email
 * Returns: JWT token for authenticated session
 * 
 * Request body: { email, code }
 * Response: { success: true, token, user: { ... } }
 */
exports.verifyCodeLogin = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and code are required',
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email not verified. Please verify via Google OAuth first',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // Find valid (unused, not expired) verification code
    const verificationRecord = await VerificationCode.findOne({
      email: email.toLowerCase(),
      code: code,
      used: false,
      expiresAt: { $gt: new Date() }, // Not expired
    });

    if (!verificationRecord) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired code',
      });
    }

    // Mark code as used
    verificationRecord.used = true;
    verificationRecord.usedAt = new Date();
    await verificationRecord.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        department: user.department,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Update last login
    user.lastLogin = new Date();
    user.save().catch(err => console.error('Error updating user:', err));

    // Log successful code-based login
    await AuditLog.create({
      user: user._id,
      action: 'LOGIN_EMAIL_CODE_SUCCESS',
      details: `${user.firstName} ${user.lastName} logged in via email verification code`,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Login successful via verification code',
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
    console.error('Verify code login error:', error);
    res.status(500).json({
      success: false,
      message: 'Code verification failed',
      error: error.message,
    });
  }
};

module.exports = exports;

