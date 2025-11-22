const { Leave } = require('../models/Leave');
const { User } = require('../models/User');

/**
 * POST /api/leave/request
 * Submit a leave request
 * Business logic (same as time correction hierarchy):
 * - Employee requires: 2 approvals (HR Staff → HR Head)
 * - HR Staff requires: 2 approvals (HR Head → Supervisor)
 * - HR Head requires: 1 approval (Supervisor only)
 */
exports.submitLeaveRequest = async (req, res) => {
  try {
    const { startDate, endDate, leaveType, reason } = req.body;
    const employeeId = req.user.id;
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    // Validate input
    if (!startDate || !endDate || !leaveType || !reason) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
    }

    // Allow today and future dates only (compare dates without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate_normalized = new Date(start);
    startDate_normalized.setHours(0, 0, 0, 0);
    
    if (startDate_normalized < today) {
      return res.status(400).json({
        success: false,
        message: 'Leave date cannot be in the past',
      });
    }

    // Calculate number of days (excluding only Sunday)
    let numberOfDays = 0;
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // Count weekdays Monday-Saturday (1-6), exclude only Sunday (0)
      if (dayOfWeek !== 0) {
        numberOfDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get user and check leave balance
    const user = await User.findById(employeeId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if leave balance needs to be reset (end of year)
    const now = new Date();
    const currentYearEnd = new Date(now.getFullYear(), 11, 31);
    if (user.leaveBalanceResetDate < now) {
      // Reset balance to 15 and set new reset date
      user.annualLeaveBalance = 15;
      user.leaveBalanceResetDate = new Date(now.getFullYear() + 1, 11, 31);
      await user.save();
    }

    // Check if user has enough leave balance
    if (user.annualLeaveBalance < numberOfDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance. You have ${user.annualLeaveBalance} days available but requested ${numberOfDays} days.`,
      });
    }

    // Determine approval requirements based on user role
    let totalApprovalsRequired = 1;
    if (userRole === 'employee') {
      totalApprovalsRequired = 2; // Employee: HR Staff → HR Head
    }
    // HR Staff and HR Head require only 1 approval each

    // Create leave request
    const leave = new Leave({
      employee: employeeId,
      startDate: start,
      endDate: end,
      leaveType,
      reason,
      numberOfDays,
      department: userDepartment,
      status: 'pending',
      currentApprovalLevel: 0,
      totalApprovalsRequired,
      submittedBy: employeeId,
    });

    await leave.save();
    await leave.populate('employee', 'firstName lastName email role department');

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leave,
    });
  } catch (error) {
    console.error('Submit leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting leave request',
      error: error.message,
    });
  }
};

/**
 * GET /api/leave/pending
 * Get pending leave requests for approval
 * 
 * Hierarchy:
 * - HR Head leaves: Only Supervisor can approve (1 approval)
 * - HR Staff leaves: Only HR Head can approve (1 approval)
 * - Employee leaves: HR Staff (first approval) → HR Head (final approval)
 */
exports.getPendingLeaveRequests = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    let query = {};

    if (userRole === 'supervisor') {
      // Supervisor approves:
      // Only HR Head leaves (at approval level 0)
      const hrHeadUsers = await User.find({ role: 'hr_head' }).select('_id');
      
      query = {
        submittedBy: { $in: hrHeadUsers.map(u => u._id) },
        status: 'pending',
        currentApprovalLevel: 0,
      };
    } else if (userRole === 'hr_head') {
      // HR Head approves:
      // 1. Employee leaves (at approval level 1 - second/final approval after HR Staff)
      // 2. HR Staff leaves (at approval level 0 - only approval)
      const employeeUsers = await User.find({ role: 'employee' }).select('_id');
      const hrStaffUsers = await User.find({ role: 'hr_staff' }).select('_id');
      
      query = {
        $or: [
          {
            submittedBy: { $in: employeeUsers.map(u => u._id) },
            status: 'approved_by_hr_staff',
            currentApprovalLevel: 1,
          },
          {
            submittedBy: { $in: hrStaffUsers.map(u => u._id) },
            status: 'pending',
            currentApprovalLevel: 0,
          },
        ],
      };
    } else if (userRole === 'hr_staff') {
      // HR Staff approves:
      // Only Employee leaves (at approval level 0 - first approval)
      const employeeUsers = await User.find({ role: 'employee' }).select('_id');
      
      query = {
        submittedBy: { $in: employeeUsers.map(u => u._id) },
        status: 'pending',
        currentApprovalLevel: 0,
      };
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const leaves = await Leave.find(query)
      .populate('employee', 'firstName lastName email department')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: leaves,
      total: leaves.length,
    });
  } catch (error) {
    console.error('Get pending leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending leave requests',
      error: error.message,
    });
  }
};

/**
 * POST /api/leave/:id/approve
 * Approve a leave request
 * When fully approved, deduct from user's leave balance
 * 
 * Approval Flow:
 * - Employee (Marketing/Treasury): HR Staff → HR Head (final)
 * - HR Staff: HR Head (final, only 1 approval)
 * - HR Head: Supervisor (final, only 1 approval)
 */
exports.approveLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments, approverComment } = req.body;
    const approverId = req.user.id;
    const approverRole = req.user.role;

    console.log(`\n🔵 Approving leave: ${id} by ${approverRole}`);

    const leave = await Leave.findById(id);
    if (!leave) {
      console.log('❌ Leave not found');
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    console.log(`Leave status: ${leave.status}, Level: ${leave.currentApprovalLevel}/${leave.totalApprovalsRequired}`);

    // Check if already fully approved or rejected
    if (leave.status === 'approved' || leave.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: `This leave request is already ${leave.status}`,
      });
    }

    // Add approval to chain
    leave.approvals.push({
      approver: approverId,
      approverRole,
      approverName: req.user.firstName + ' ' + req.user.lastName,
      action: 'approved',
      comments: comments || approverComment || '',
      approvedAt: new Date(),
    });

    leave.currentApprovalLevel += 1;

    // Check if all approvals are complete
    if (leave.currentApprovalLevel >= leave.totalApprovalsRequired) {
      console.log('✓ All approvals complete, marking as approved');
      leave.status = 'approved';
      leave.approvedAt = new Date();

      // Deduct from user's leave balance
      const employee = await User.findById(leave.submittedBy);
      if (employee) {
        console.log(`Deducting ${leave.numberOfDays} days from ${employee.firstName}'s balance (${employee.annualLeaveBalance} → ${employee.annualLeaveBalance - leave.numberOfDays})`);
        employee.annualLeaveBalance -= leave.numberOfDays;
        await employee.save();
        console.log('✓ Leave balance updated');
      } else {
        console.log('⚠️ Employee not found for balance update');
      }
    } else {
      console.log(`Waiting for further approvals (${leave.currentApprovalLevel}/${leave.totalApprovalsRequired})`);
      // Update status to show who approved it based on submitter role
      const submitterUser = await User.findById(leave.submittedBy);
      if (submitterUser) {
        const submitterRole = submitterUser.role;

        if (submitterRole === 'employee') {
          // Employee flow: HR Staff → HR Head (final)
          if (approverRole === 'hr_staff') {
            leave.status = 'approved_by_hr_staff';
          }
          // HR Head approval will auto-complete (totalApprovalsRequired = 2)
        } else if (submitterRole === 'hr_staff') {
          // HR Staff: HR Head only (final, totalApprovalsRequired = 1)
          // This shouldn't reach else block as it should be auto-approved
        } else if (submitterRole === 'hr_head') {
          // HR Head: Supervisor only (final, totalApprovalsRequired = 1)
          // This shouldn't reach else block as it should be auto-approved
        }
      }
    }

    await leave.save();
    console.log('✓ Leave saved successfully');
    
    // Populate employee details if it exists
    if (leave.employee) {
      try {
        await leave.populate('employee', 'firstName lastName email');
      } catch (populateErr) {
        console.error('⚠️ Error populating employee:', populateErr.message);
        // Continue anyway, population is not critical
      }
    }

    res.status(200).json({
      success: true,
      message: leave.status === 'approved' ? 'Leave request approved' : 'Approval recorded, awaiting further approval',
      data: leave,
    });
  } catch (error) {
    console.error('❌ Approve leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving leave request',
      error: error.message,
    });
  }
};

/**
 * POST /api/leave/:id/reject
 * Reject a leave request
 */
exports.rejectLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const rejecterId = req.user.id;
    const rejecterRole = req.user.role;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    // Check if already fully approved or rejected
    if (leave.status === 'approved' || leave.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: `This leave request is already ${leave.status}`,
      });
    }

    // Record rejection
    leave.approvals.push({
      approver: rejecterId,
      approverRole: rejecterRole,
      approverName: req.user.firstName + ' ' + req.user.lastName,
      action: 'rejected',
      comments: rejectionReason,
      approvedAt: new Date(),
    });

    leave.status = 'rejected';
    leave.rejectedAt = new Date();
    leave.rejectionReason = rejectionReason;

    await leave.save();
    await leave.populate('employee', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Leave request rejected',
      data: leave,
    });
  } catch (error) {
    console.error('Reject leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting leave request',
      error: error.message,
    });
  }
};

/**
 * GET /api/leave/my-requests
 * Get all leave requests submitted by current user
 */
exports.getMyLeaveRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await Leave.find({ submittedBy: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
      total: requests.length,
    });
  } catch (error) {
    console.error('Get my leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your leave requests',
      error: error.message,
    });
  }
};

/**
 * GET /api/leave/history
 * Get leave history with filtering
 */
exports.getLeaveHistory = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const userDepartment = req.user.department;
    const { status, department } = req.query;

    let query = {};

    // Employees see only their own leaves
    if (userRole === 'employee') {
      query.submittedBy = userId;
    }
    // Supervisors see all leaves (they supervise all departments)
    else if (userRole === 'supervisor') {
      // Supervisors see all leaves regardless of department
      // No department filter for supervisors
    }
    // HR Staff and HR Head see all leaves
    else if (['hr_staff', 'hr_head'].includes(userRole)) {
      if (department) {
        query.department = department;
      }
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    console.log('📋 Leave history query:', query);
    
    const leaves = await Leave.find(query)
      .populate('employee', 'firstName lastName email department')
      .sort({ createdAt: -1 });

    console.log('✓ Leaves found:', leaves.length);

    res.status(200).json({
      success: true,
      data: leaves,
      total: leaves.length,
    });
  } catch (error) {
    console.error('Get leave history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave history',
      error: error.message,
    });
  }
};
