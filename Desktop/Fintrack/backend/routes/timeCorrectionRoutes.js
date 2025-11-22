const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const {
  submitTimeCorrection,
  getPendingApprovals,
  approveTimeCorrection,
  rejectTimeCorrection,
  getMyRequests,
  getCorrectionHistory,
} = require('../controllers/timeCorrectionController');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Submit a time correction (all authenticated users)
router.post('/request', submitTimeCorrection);

// Get my submitted requests
router.get('/my-requests', getMyRequests);

// Get correction history
// Employees see only their own, Supervisors/HR Staff/HR Head see all
router.get('/history', getCorrectionHistory);

// Get pending approvals for current user
// Requires: supervisor, hr_head, or hr_staff role
router.get(
  '/pending-approvals',
  roleMiddleware(['supervisor', 'hr_head', 'hr_staff']),
  getPendingApprovals
);

// Approve a time correction
// Requires: supervisor, hr_head, or hr_staff role
router.post(
  '/:id/approve',
  roleMiddleware(['supervisor', 'hr_head', 'hr_staff']),
  approveTimeCorrection
);

// Reject a time correction
// Requires: supervisor, hr_head, or hr_staff role
router.post(
  '/:id/reject',
  roleMiddleware(['supervisor', 'hr_head', 'hr_staff']),
  rejectTimeCorrection
);

module.exports = router;
