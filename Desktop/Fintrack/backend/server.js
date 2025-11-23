const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

// Import Passport configuration
require('./config/passport');

// Import database connection manager
const { connectToDatabase, setupConnectionListeners, isConnectionHealthy } = require('./utils/dbConnection');

// Import routes and middleware
const authRoutes = require('./routes/auth');
const authRoutesNew = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendance');
const timeCorrectionRoutes = require('./routes/timeCorrectionRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const payrollRoutes = require('./routes/payroll');
const { cleanupRateLimitMiddleware } = require('./middleware/rateLimitMiddleware');
const { User, ROLES, DEPARTMENTS } = require('./models/User');

const app = express();

// Session configuration for Passport
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongoUrl: process.env.MONGO_URI,
    touchAfter: 24 * 3600, // Lazy session update (in seconds)
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Middleware
// CORS configuration - Support production, preview, and development URLs
// CORS configuration - Support production, preview, and development URLs
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // server-to-server or mobile requests

    // Allow production and localhost explicitly
    const allowedOrigins = [
      'https://fintrackapp.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173',
    ];
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow all Vercel preview deployments
    if (origin.endsWith('.vercel.app')) return callback(null, true);

    console.log('❌ Blocked by CORS:', origin);
    return callback(new Error('CORS not allowed from origin: ' + origin));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// Fix preflight OPTION request handling
app.options('*', cors());
// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection with retry logic
(async () => {
  try {
    await connectToDatabase(process.env.MONGO_URI);
    setupConnectionListeners();
  } catch (err) {
    console.error('Failed to initialize database connection:', err.message);
    console.log('⚠️  Server starting without database - requests will fail until connection is restored');
  }
})();

// PRODUCTION FIX: Auto-seed government tax tables on startup
const GovernmentTaxTables = require('./models/GovernmentTaxTables');
const initializeTaxTables = async () => {
  try {
    const existingTables = await GovernmentTaxTables.findOne();
    if (!existingTables) {
      console.log('🔄 Initializing government tax tables...');
      const taxTables = new GovernmentTaxTables({
        sssContributions: [
          { salaryRange: { min: 1000, max: 1249.99 }, monthlyContribution: 110 },
          { salaryRange: { min: 1250, max: 1499.99 }, monthlyContribution: 137.50 },
          { salaryRange: { min: 1500, max: 1749.99 }, monthlyContribution: 165 },
          { salaryRange: { min: 1750, max: 1999.99 }, monthlyContribution: 192.50 },
          { salaryRange: { min: 2000, max: 2249.99 }, monthlyContribution: 220 },
          { salaryRange: { min: 2250, max: 2499.99 }, monthlyContribution: 247.50 },
          { salaryRange: { min: 2500, max: 100000 }, monthlyContribution: 275 },
        ],
        philhealthContributions: [
          { salaryRange: { min: 0, max: 10000 }, monthlyContribution: 0 },
          { salaryRange: { min: 10000.01, max: 40000 }, monthlyContribution: 137.50 },
          { salaryRange: { min: 40000.01, max: 100000 }, monthlyContribution: 550 },
        ],
        pagibigContributions: [
          { salaryRange: { min: 1500, max: 4999.99 }, monthlyContribution: 50 },
          { salaryRange: { min: 5000, max: 100000 }, monthlyContribution: 100 },
        ],
        withholdingTaxBrackets: [
          { incomeRange: { min: 0, max: 250000 }, taxRate: 0, fixedTaxAmount: 0, description: 'Not Subject to Tax' },
          { incomeRange: { min: 250000.01, max: 400000 }, taxRate: 15, fixedTaxAmount: -37500, description: '15%' },
          { incomeRange: { min: 400000.01, max: 800000 }, taxRate: 20, fixedTaxAmount: -97500, description: '20%' },
          { incomeRange: { min: 800000.01, max: 2000000 }, taxRate: 25, fixedTaxAmount: -297500, description: '25%' },
          { incomeRange: { min: 2000000.01, max: 100000000 }, taxRate: 30, fixedTaxAmount: -797500, description: '30%' },
        ],
      });
      await taxTables.save();
      console.log('✅ Government tax tables initialized successfully');
    }
  } catch (error) {
    console.error('⚠️ Error initializing tax tables:', error.message);
    // Don't crash server if tax tables initialization fails
  }
};

// Initialize tax tables after DB connection
mongoose.connection.on('connected', () => {
  console.log('✓ Mongoose connected to MongoDB');
  initializeTaxTables();
});

mongoose.connection.on('error', (err) => {
  console.error('✗ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Mongoose disconnected from MongoDB');
});

// Initialize rate limit cleanup
cleanupRateLimitMiddleware();

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'FinTrack API is running' });
});

// New Authentication Routes (with Google OAuth) - REGISTER FIRST
// POST   /auth/login - Local login (with verification gate)
// GET    /auth/google - Initiate Google OAuth
// GET    /auth/google/callback - Google OAuth callback
// POST   /auth/check-verification - Check email verification status
// POST   /auth/users/create - Create new user (role-based)
// GET    /auth/me - Get current user
app.use('/auth', authRoutesNew);

// Legacy Authentication Routes (keep for backward compatibility)
// POST   /api/auth/login - Login and get JWT token
// POST   /api/auth/register - Register new user (HR_HEAD/ADMIN only)
// POST   /api/auth/logout - Logout and log event
// GET    /api/auth/me - Get current user info
// GET    /api/auth/users - Get all users (ADMIN only)
// GET    /api/auth/audit-logs - Get audit logs (ADMIN only)
app.use('/api/auth', authRoutes);

// Attendance routes
// POST   /api/attendance/checkin - Check in for the day
// POST   /api/attendance/checkout - Check out for the day
// GET    /api/attendance/today - Get today's attendance
// GET    /api/attendance/department - Get department attendance
// GET    /api/attendance/all - Get all attendance (HR Head only)
// GET    /api/attendance/report - Get attendance report with stats
app.use('/api/attendance', attendanceRoutes);

// Time Correction routes
// POST   /api/time-correction/request - Submit time correction request
// GET    /api/time-correction/pending-approvals - Get pending approvals for current user
// POST   /api/time-correction/:id/approve - Approve time correction
// POST   /api/time-correction/:id/reject - Reject time correction
// GET    /api/time-correction/my-requests - Get user's submitted requests
app.use('/api/time-correction', timeCorrectionRoutes);

// Leave routes
// POST   /api/leave/request - Submit leave request
// GET    /api/leave/pending - Get pending leave requests for approval
// POST   /api/leave/:id/approve - Approve leave request
// POST   /api/leave/:id/reject - Reject leave request
// GET    /api/leave/my-requests - Get user's leave requests
// GET    /api/leave/history - Get leave history
app.use('/api/leave', leaveRoutes);

// Payroll routes
// POST   /api/payroll/initialize - Initialize payroll period (HR Staff)
// PUT    /api/payroll/:payrollPeriodId/:employeeId/compute - Compute payroll (HR Staff)
// GET    /api/payroll/:payrollPeriodId - Get payroll records (HR Staff/Head)
// GET    /api/payroll/:payrollPeriodId/summary - Get payroll summary (HR Staff/Head)
// PUT    /api/payroll/:payrollRecordId/approve - Approve payroll (HR Head)
// PUT    /api/payroll/:payrollRecordId/reject - Reject payroll (HR Head)
// PUT    /api/payroll/:payrollPeriodId/lock - Lock payroll period (HR Head)
// POST   /api/payroll/:payrollPeriodId/generate-payslips - Generate payslips (HR Head)
// GET    /api/payroll/payslips/me - Get employee's payslips
// GET    /api/payroll/payslips/:payslipId - View payslip
// GET    /api/payroll/payslips/:payslipId/pdf - Export payslip PDF
app.use('/api/payroll', payrollRoutes);

// Report routes - Centralized reporting (PDF & Excel export)
// GET    /api/reports/attendance/data - Get attendance data
// POST   /api/reports/attendance/excel - Export attendance to Excel
// POST   /api/reports/attendance/pdf - Export attendance to PDF
// GET    /api/reports/payroll/data - Get payroll data
// POST   /api/reports/payroll/excel - Export payroll to Excel
// POST   /api/reports/payroll/pdf - Export payroll to PDF
// GET    /api/reports/leave/data - Get leave data
// POST   /api/reports/leave/excel - Export leave to Excel
const reportRoutes = require('./routes/reports');
app.use('/api/reports', reportRoutes);

// Audit Logs Routes
// GET    /api/audit-logs/paginated - Get paginated audit logs (Recent Activity)
const auditLogRoutes = require('./routes/auditLogs');
app.use('/api/audit-logs', auditLogRoutes);

// Tax Settings Routes
// GET    /api/tax-settings - Get tax settings (HR Head)
// PUT    /api/tax-settings - Update tax settings and sync (HR Head)
// GET    /api/tax-settings/summary - Get tax exemption summary
const taxSettingsRoutes = require('./routes/taxSettings');
app.use('/api/tax-settings', taxSettingsRoutes);

// Voucher Routes
// POST   /api/vouchers - Create new voucher batch
// GET    /api/vouchers - Get all vouchers
// GET    /api/vouchers/:id - Get voucher details
// POST   /api/vouchers/:id/use - Use vouchers
// POST   /api/vouchers/:id/replenish - Replenish stock
// POST   /api/vouchers/:id/status - Update status
// GET    /api/vouchers/low-stock - Get low stock vouchers
const voucherRoutes = require('./routes/vouchers');
app.use('/api/vouchers', voucherRoutes);

// Announcement Routes
// POST   /api/announcements - Create announcement (HR Head only)
// GET    /api/announcements - Get all announcements
// GET    /api/announcements/:id - Get single announcement
// POST   /api/announcements/:id/read - Mark as read
// POST   /api/announcements/read/all - Mark all as read
// DELETE /api/announcements/:id - Delete announcement
const announcementRoutes = require('./routes/announcements');
app.use('/api/announcements', announcementRoutes);

// Gas Pricing Routes
// GET    /api/gas-pricing/current - Get current gas price
// GET    /api/gas-pricing/history - Get pricing history
// GET    /api/gas-pricing/upcoming - Get upcoming prices (3 days)
// POST   /api/gas-pricing/update - Update price (HR Head only)
const gasPricingRoutes = require('./routes/gasPricing');
app.use('/api/gas-pricing', gasPricingRoutes);

// Performance Evaluation Routes
// POST   /api/performance-evaluations - Create evaluation
// GET    /api/performance-evaluations - Get all evaluations
// GET    /api/performance-evaluations/:id - Get single evaluation
// PUT    /api/performance-evaluations/:id - Update evaluation
// POST   /api/performance-evaluations/:id/submit - Submit for approval
// POST   /api/performance-evaluations/:id/approve - Approve evaluation (HR Head only)
// POST   /api/performance-evaluations/:id/acknowledge - Employee acknowledge
// DELETE /api/performance-evaluations/:id - Delete evaluation
const performanceEvaluationRoutes = require('./routes/performanceEvaluation');
app.use('/api/performance-evaluations', performanceEvaluationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbConnected = isConnectionHealthy();
  const status = dbConnected ? 'healthy' : 'degraded';
  const statusCode = dbConnected ? 200 : 503;
  
  res.status(statusCode).json({ 
    status: status,
    timestamp: new Date(),
    database: dbConnected ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║  FinTrack HRIS API Server Running    ║
║  Port: ${PORT}                        ║
║  API: http://localhost:${PORT}       ║
║  CORS: Production & Preview URLs     ║
╚══════════════════════════════════════╝
  `);
  console.log('Allowed Origins:');
  console.log('  ✓ https://fintrackapp.vercel.app (Production)');
  console.log('  ✓ https://fin-track-1jpopugyo-fintracks-projects-9fd35663.vercel.app (Preview)');
  console.log('  ✓ http://localhost:3000 (Dev)');
  console.log('  ✓ http://localhost:5173 (Vite)');
  console.log('\nAvailable endpoints:');
  console.log('  POST   /api/auth/login - Login');
  console.log('  POST   /api/auth/logout - Logout');
  console.log('  POST   /api/auth/register - Register user (role-based hierarchy)');
  console.log('  GET    /api/auth/me - Get current user');
  console.log('  GET    /api/auth/users - List users (role-based)');
  console.log('  GET    /api/auth/audit-logs - View audit logs (Seeder Admin only)');
  console.log('  POST   /api/attendance/checkin - Check in for the day');
  console.log('  POST   /api/attendance/checkout - Check out for the day');
  console.log('  GET    /api/attendance/today - Get today\'s attendance');
  console.log('  GET    /api/attendance/department - Get department attendance');
  console.log('  GET    /api/attendance/all - Get all attendance (HR Head only)');
  console.log('  GET    /api/attendance/report - Get attendance report with stats');
  console.log('  POST   /api/time-correction/request - Submit time correction request');
  console.log('  GET    /api/time-correction/pending-approvals - Get pending approvals');
  console.log('  POST   /api/time-correction/:id/approve - Approve time correction');
  console.log('  POST   /api/time-correction/:id/reject - Reject time correction');
  console.log('  GET    /api/time-correction/my-requests - Get submitted requests');
  console.log('\nSetup Instructions:');
  console.log('  1. Run: node seed.js (creates Seeder Admin)');
  console.log('  2. Login as seeder_admin@fintrack.com / Admin@123456');
  console.log('  3. Create Supervisors via dashboard');
  console.log('  4. Supervisors create HR Heads');
  console.log('  5. HR Heads create HR Staff & Employees');
});
