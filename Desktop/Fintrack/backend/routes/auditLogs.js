const express = require('express');
const router = express.Router();
const { getPaginatedAuditLogs } = require('../controllers/auditLogController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All audit log endpoints require authentication
router.use(authMiddleware);

/**
 * GET /api/audit-logs/paginated
 * Get paginated audit logs (Recent Activity)
 * HR Head, HR Staff, and Supervisors can access
 */
router.get('/paginated', (req, res, next) => {
  const userRole = req.user.role;
  if (!['hr_staff', 'hr_head', 'supervisor'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only HR Staff, HR Head, and Supervisors can view audit logs',
    });
  }
  next();
}, getPaginatedAuditLogs);

module.exports = router;
