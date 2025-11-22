const express = require('express');
const router = express.Router();
const {
  submitLeaveRequest,
  getPendingLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  getMyLeaveRequests,
  getLeaveHistory,
} = require('../controllers/leaveController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All leave endpoints require authentication
router.use(authMiddleware);

/**
 * POST /api/leave/request
 * Submit a leave request
 * All roles can submit leave
 */
router.post('/request', submitLeaveRequest);

/**
 * GET /api/leave/my-requests
 * Get user's own leave requests
 */
router.get('/my-requests', getMyLeaveRequests);

/**
 * GET /api/leave/pending
 * Get pending leave requests for approval
 * Supervisors, HR Staff, HR Head can access
 */
router.get('/pending', (req, res, next) => {
  const userRole = req.user.role;
  if (!['supervisor', 'hr_staff', 'hr_head'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only supervisors and HR can view pending leave requests',
    });
  }
  next();
}, getPendingLeaveRequests);

/**
 * POST /api/leave/:id/approve
 * Approve a leave request
 * Supervisors, HR Staff, HR Head can approve
 */
router.post('/:id/approve', (req, res, next) => {
  const userRole = req.user.role;
  if (!['supervisor', 'hr_staff', 'hr_head'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only supervisors and HR can approve leave requests',
    });
  }
  next();
}, approveLeaveRequest);

/**
 * POST /api/leave/:id/reject
 * Reject a leave request
 * Supervisors, HR Staff, HR Head can reject
 */
router.post('/:id/reject', (req, res, next) => {
  const userRole = req.user.role;
  if (!['supervisor', 'hr_staff', 'hr_head'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only supervisors and HR can reject leave requests',
    });
  }
  next();
}, rejectLeaveRequest);

/**
 * GET /api/leave/history
 * Get leave history
 * All roles can access with appropriate filtering
 */
router.get('/history', getLeaveHistory);

module.exports = router;
