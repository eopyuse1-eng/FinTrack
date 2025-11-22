const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * PAYROLL ROUTES WITH ROLE-BASED ACCESS CONTROL
 * 
 * Roles:
 * - hr_staff: Can initialize, compute payroll, view payroll records
 * - hr_head: Can approve/reject payroll, lock period, generate payslips
 * - employee: Can view own payslips
 */

// ============================================================================
// MIDDLEWARE: Check RBAC
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
// HR STAFF ENDPOINTS
// ============================================================================

/**
 * GET /api/payroll
 * Get all payroll periods
 * HR Staff and HR Head
 */
router.get('/', authMiddleware, requireRole(['hr_staff', 'hr_head']), payrollController.getPayrollPeriods);

/**
 * GET /api/payroll/periods
 * Get all payroll periods (alias for /api/payroll)
 * HR Staff and HR Head
 */
router.get('/periods', authMiddleware, requireRole(['hr_staff', 'hr_head']), payrollController.getPayrollPeriods);

/**
 * POST /api/payroll/initialize
 * Initialize payroll period with all employee records
 * HR Staff and HR Head
 */
router.post('/initialize', authMiddleware, requireRole(['hr_staff', 'hr_head']), payrollController.initializePayroll);

/**
 * POST /api/payroll/:payrollPeriodId/compute-all
 * Compute payroll for all employees in a period
 * HR Staff and HR Head
 */
router.post('/:payrollPeriodId/compute-all', authMiddleware, requireRole(['hr_staff', 'hr_head']), payrollController.computeAllPayroll);

/**
 * PUT /api/payroll/:payrollPeriodId/:employeeId/compute
 * Compute payroll for single employee
 * HR Staff only
 */
router.put('/:payrollPeriodId/:employeeId/compute', authMiddleware, requireRole(['hr_staff']), payrollController.computePayroll);

// ============================================================================
// HR HEAD ENDPOINTS - SPECIFIC ROUTES (MUST BE BEFORE GENERIC :payrollPeriodId)
// ============================================================================

/**
 * PUT /api/payroll/:payrollPeriodId/lock
 * Lock payroll period (finalize, no more changes)
 * HR Head only
 */
router.put('/:payrollPeriodId/lock', authMiddleware, requireRole(['hr_head']), payrollController.lockPayrollPeriod);

/**
 * POST /api/payroll/:payrollPeriodId/generate-payslips
 * Generate payslips from approved payroll records
 * HR Head only
 */
router.post('/:payrollPeriodId/generate-payslips', authMiddleware, requireRole(['hr_head']), payrollController.generatePayslips);

/**
 * GET /api/payroll/:payrollPeriodId/summary
 * Get payroll summary
 * HR Staff and HR Head
 */
router.get('/:payrollPeriodId/summary', authMiddleware, requireRole(['hr_staff', 'hr_head']), payrollController.getPayrollSummary);

/**
 * PUT /api/payroll/:payrollRecordId/approve
 * Approve payroll record
 * HR Head only
 */
router.put('/:payrollRecordId/approve', authMiddleware, requireRole(['hr_head']), payrollController.approvePayrollRecord);

/**
 * PUT /api/payroll/:payrollRecordId/reject
 * Reject payroll record (send back for recomputation)
 * HR Head only
 */
router.put('/:payrollRecordId/reject', authMiddleware, requireRole(['hr_head']), payrollController.rejectPayrollRecord);

/**
 * GET /api/payroll/:payrollPeriodId
 * Get all payroll records for a period
 * HR Staff and HR Head
 * NOTE: This MUST come AFTER specific routes to avoid param matching conflicts
 */
router.get('/:payrollPeriodId', authMiddleware, requireRole(['hr_staff', 'hr_head']), payrollController.getPayrollPeriodRecords);

// ============================================================================
// EMPLOYEE ENDPOINTS
// ============================================================================

/**
 * GET /api/payroll/payslips/me
 * Get employee's own payslips
 * All staff roles can view own payslips
 * NOTE: This MUST come before /:payslipId routes to avoid generic param matching
 */
router.get('/payslips/me', authMiddleware, requireRole(['employee', 'marketing_staff', 'treasury_staff', 'supervisor', 'hr_staff', 'hr_head']), payrollController.getMyPayslips);

/**
 * GET /api/payroll/payslips/:payslipId/pdf
 * Export payslip as PDF
 * NOTE: This MUST come before /payslips/:payslipId to avoid param matching
 */
router.get('/payslips/:payslipId/pdf', authMiddleware, payrollController.exportPayslipPDF);

/**
 * GET /api/payroll/payslips/:payslipId
 * View single payslip (employee views own, HR can view any)
 */
router.get('/payslips/:payslipId', authMiddleware, payrollController.getPayslip);

module.exports = router;
