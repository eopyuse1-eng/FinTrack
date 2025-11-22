const { AuditLog } = require('../models/AuditLog');

/**
 * GET /api/audit-logs/paginated
 * Get paginated audit logs (Recent Activity)
 * HR Head, HR Staff, and Supervisors can access
 * Query params: page (default 1), limit (default 10)
 */
exports.getPaginatedAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Filter out login/logout - only show meaningful business activity
    const filter = { action: { $nin: ['login', 'logout'] } };
    
    // Get total count for pagination info
    const total = await AuditLog.countDocuments(filter);
    
    // Get paginated records - most recent first
    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);

    // Transform logs to activity format
    const activities = logs.map(log => {
      let type = 'default';
      let message = '';

      switch (log.action) {
        case 'approved':
          type = 'leave_approved';
          message = `${log.email} approved a leave request`;
          break;
        case 'rejected':
          type = 'leave_rejected';
          message = `${log.email} rejected a leave request`;
          break;
        case 'leave_requested':
          type = 'leave_request';
          message = `${log.email} submitted a leave request`;
          break;
        case 'password_change':
          type = 'security';
          message = `${log.email} changed password`;
          break;
        case 'registration':
          type = 'registration';
          message = `New user registered: ${log.email}`;
          break;
        case 'payroll_computed':
          type = 'payroll';
          message = `Payroll computed for the period`;
          break;
        case 'payroll_approved':
          type = 'payroll';
          message = `Payroll approved`;
          break;
        case 'payroll_locked':
          type = 'payroll';
          message = `Payroll period locked`;
          break;
        case 'payslips_generated':
          type = 'payroll';
          message = `Payslips generated for employees`;
          break;
        default:
          message = `${log.email} - ${log.action}`;
      }

      return {
        type,
        message,
        time: log.createdAt,
        email: log.email,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        activities,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords: total,
          recordsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error('Get paginated audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit logs',
      error: error.message,
    });
  }
};
