const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getTodayAttendance,
  getDepartmentAttendance,
  getAllAttendance,
  getAttendanceReport,
  getDashboardStats,
  getPaginatedAttendance,
} = require('../controllers/attendanceController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All attendance endpoints require authentication
router.use(authMiddleware);

/**
 * POST /api/attendance/checkin
 * Employee checks in for the day
 * All roles can check in
 */
router.post('/checkin', checkIn);

/**
 * POST /api/attendance/checkout
 * Employee checks out for the day
 * All roles can check out
 */
router.post('/checkout', checkOut);

/**
 * GET /api/attendance/today
 * Get logged-in employee's today attendance
 * All roles can access their own attendance
 */
router.get('/today', getTodayAttendance);

/**
 * GET /api/attendance/dashboard/stats
 * Get dashboard statistics (total employees, present, absent, pending leaves)
 * HR Head and HR Staff can access
 * MUST BE BEFORE /report route
 */
router.get('/dashboard/stats', (req, res, next) => {
  const userRole = req.user.role;
  if (!['hr_staff', 'hr_head'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only HR Staff and HR Head can view dashboard stats',
    });
  }
  next();
}, getDashboardStats);

/**
 * GET /api/attendance/paginated
 * Get paginated attendance records
 * HR Head and HR Staff can access
 */
router.get('/paginated', (req, res, next) => {
  const userRole = req.user.role;
  if (!['hr_staff', 'hr_head'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only HR Staff and HR Head can view attendance',
    });
  }
  next();
}, getPaginatedAttendance);

/**
 * GET /api/attendance/department
 * Get department attendance
 * HR Staff can see their department
 * HR Head can see any department (filtered by query param)
 * HR Staff role check is done in controller based on department in token
 */
router.get('/department', (req, res, next) => {
  const userRole = req.user.role;
  // HR Staff and HR Head can access department attendance
  if (!['hr_staff', 'hr_head'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only HR Staff and HR Head can view department attendance',
    });
  }
  next();
}, getDepartmentAttendance);

/**
 * GET /api/attendance/all
 * Get all attendance across all departments
 * HR Head and HR Staff can access (they handle time corrections)
 */
router.get('/all', (req, res, next) => {
  const userRole = req.user.role;
  if (!['hr_head', 'hr_staff'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only HR Head and HR Staff can view all attendance',
    });
  }
  next();
}, getAllAttendance);

/**
 * GET /api/attendance/report
 * Get attendance report with statistics
 * HR Head and HR Staff can access
 */
router.get('/report', (req, res, next) => {
  const userRole = req.user.role;
  if (!['hr_staff', 'hr_head'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only HR Staff and HR Head can generate reports',
    });
  }
  next();
}, getAttendanceReport);

module.exports = router;
