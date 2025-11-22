/**
 * Authentication Routes
 * Handles login, registration, OAuth, and verification
 */

const express = require('express');
const passport = require('passport');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const { rateLimitMiddleware } = require('../middleware/rateLimitMiddleware');
const authController = require('../controllers/authController');

const router = express.Router();

/**
 * POST /auth/login
 * Local login with email/password
 * Verification Gate: User must have isEmailVerified = true OR be demo seed
 * Also available at /api/auth/login for backward compatibility
 */
router.post('/login', rateLimitMiddleware(), authController.login);

/**
 * GET /auth/google
 * Initiate Google OAuth login
 * Redirects user to Google for authentication
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

/**
 * GET /auth/google/callback
 * Google OAuth callback
 * After user authenticates with Google, they're redirected here
 * Sets isEmailVerified = true and creates/updates user
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login?error=google_auth_failed',
    session: false,
  }),
  authController.googleAuthCallback
);

/**
 * POST /auth/check-verification
 * Check if email needs Gmail verification
 * Used by frontend to show appropriate UI
 */
router.post('/check-verification', authController.checkEmailVerification);

/**
 * POST /auth/users/create
 * Create new user with role-based hierarchy
 * Requires authentication and proper role
 * 
 * Rules:
 * - Seeder Admin creates Supervisors
 * - Supervisors create HR Heads
 * - HR Heads create HR Staff & Employees
 */
router.post(
  '/users/create',
  authMiddleware,
  roleMiddleware(['seeder_admin', 'supervisor', 'hr_head']),
  authController.createUser
);

/**
 * GET /auth/me
 * Get current user info
 * Requires authentication
 */
router.get('/me', authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
      isEmailVerified: req.user.isEmailVerified,
    },
  });
});

module.exports = router;
