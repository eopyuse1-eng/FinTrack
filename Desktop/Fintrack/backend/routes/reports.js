/**
 * Report Routes - PDF & Excel Export
 * Centralized reporting endpoints for HR Head and HR Staff
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/authMiddleware');

// ============================================================================
// MIDDLEWARE: Role-based access control
// ============================================================================

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

// ============================================================================
// ATTENDANCE REPORTS
// ============================================================================

/**
 * GET /api/reports/attendance/data
 * Get attendance report data with filters
 * HR Head, HR Staff
 */
router.get(
  '/attendance/data',
  authMiddleware,
  requireRole(['hr_head', 'hr_staff']),
  reportController.getAttendanceReportData
);

/**
 * POST /api/reports/attendance/excel
 * Export attendance to Excel
 * HR Head, HR Staff
 */
router.post(
  '/attendance/excel',
  authMiddleware,
  requireRole(['hr_head', 'hr_staff']),
  reportController.exportAttendanceExcel
);

/**
 * POST /api/reports/attendance/pdf
 * Export attendance to PDF
 * HR Head, HR Staff
 */
router.post(
  '/attendance/pdf',
  authMiddleware,
  requireRole(['hr_head', 'hr_staff']),
  reportController.exportAttendancePDF
);

// ============================================================================
// PAYROLL REPORTS
// ============================================================================

/**
 * GET /api/reports/payroll/data
 * Get payroll report data
 * HR Head, HR Staff
 */
router.get(
  '/payroll/data',
  authMiddleware,
  requireRole(['hr_head', 'hr_staff']),
  reportController.getPayrollReportData
);

/**
 * POST /api/reports/payroll/excel
 * Export payroll to Excel
 * HR Head, HR Staff
 */
router.post(
  '/payroll/excel',
  authMiddleware,
  requireRole(['hr_head', 'hr_staff']),
  reportController.exportPayrollExcel
);

/**
 * POST /api/reports/payroll/pdf
 * Export payroll to PDF
 * HR Head, HR Staff
 */
router.post(
  '/payroll/pdf',
  authMiddleware,
  requireRole(['hr_head', 'hr_staff']),
  reportController.exportPayrollPDF
);

// ============================================================================
// LEAVE REPORTS
// ============================================================================

/**
 * GET /api/reports/leave/data
 * Get leave report data
 * HR Head, HR Staff
 */
router.get(
  '/leave/data',
  authMiddleware,
  requireRole(['hr_head', 'hr_staff']),
  reportController.getLeaveReportData
);

/**
 * POST /api/reports/leave/excel
 * Export leave to Excel
 * HR Head, HR Staff
 */
router.post(
  '/leave/excel',
  authMiddleware,
  requireRole(['hr_head', 'hr_staff']),
  reportController.exportLeaveExcel
);

/**
 * POST /api/reports/leave/pdf
 * Export leave to PDF
 * HR Head, HR Staff
 */
router.post(
  '/leave/pdf',
  authMiddleware,
  requireRole(['hr_head', 'hr_staff']),
  reportController.exportLeavePDF
);

// ============================================================================
// PERFORMANCE EVALUATION REPORTS
// ============================================================================

/**
 * GET /api/reports/performance/data
 * Get performance evaluation report data
 * HR Head, HR Staff
 */
router.get(
  '/performance/data',
  authMiddleware,
  requireRole(['hr_head', 'hr_staff']),
  reportController.getPerformanceReportData
);

/**
 * POST /api/reports/performance/excel
 * Export performance evaluation to Excel
 * HR Head, HR Staff
 */
router.post(
  '/performance/excel',
  authMiddleware,
  requireRole(['hr_head', 'hr_staff']),
  reportController.exportPerformanceExcel
);

/**
 * POST /api/reports/performance/pdf
 * Export performance evaluation to PDF
 * HR Head, HR Staff
 */
router.post(
  '/performance/pdf',
  authMiddleware,
  requireRole(['hr_head', 'hr_staff']),
  reportController.exportPerformancePDF
);

module.exports = router;
