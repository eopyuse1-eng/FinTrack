const { TimeCorrection } = require('../models/TimeCorrection');
const { Attendance } = require('../models/Attendance');
const { User } = require('../models/User');

/**
 * POST /api/time-correction/request
 * Submit a time correction request
 * Business logic:
 * - HR Head requires: 1 approval (Supervisor only)
 * - HR Staff requires: 2 approvals (HR Head or Supervisor, then the other)
 * - Employee (Treasury/Marketing) requires: 2 approvals (HR Staff → HR Head)
 */
exports.submitTimeCorrection = async (req, res) => {
  try {
    const { attendanceId, correctedCheckInTime, correctedCheckOutTime, reason } = req.body;
    const employeeId = req.user.id;
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    // Validate input
    if (!attendanceId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Attendance ID and reason are required',
      });
    }

    // Find the attendance record
    const attendance = await Attendance.findById(attendanceId).populate('employee');
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    // Verify the user is correcting their own attendance
    if (attendance.employee._id.toString() !== employeeId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only correct your own attendance',
      });
    }

    // Calculate corrected total hours and determine status
    let correctedTotalHours = 0;
    let correctedStatus = 'present';

    if (correctedCheckInTime && correctedCheckOutTime) {
      const checkIn = new Date(correctedCheckInTime);
      const checkOut = new Date(correctedCheckOutTime);
      const totalMs = checkOut - checkIn;
      correctedTotalHours = Math.round((totalMs / (1000 * 60 * 60)) * 100) / 100;

      // If both check-in and check-out times exist, mark as checked-out
      correctedStatus = 'checked-out';
    } else if (correctedCheckInTime) {
      // If only check-in time, determine status based on check-in hour
      const checkIn = new Date(correctedCheckInTime);
      const checkInHour = checkIn.getHours();
      if (checkInHour < 9) {
        correctedStatus = 'present';
      } else if (checkInHour < 13.5) {
        correctedStatus = 'late';
      } else {
        correctedStatus = 'absent';
      }
    }

    // Determine approval requirements based on user role
    let totalApprovalsRequired = 1;
    if (userRole === 'hr_staff' || userRole === 'employee') {
      totalApprovalsRequired = 2;
    }

    // Create time correction request
    const timeCorrection = new TimeCorrection({
      employee: employeeId,
      attendanceRecord: attendanceId,
      correctionDate: attendance.date,
      originalCheckInTime: attendance.checkInTime,
      originalCheckOutTime: attendance.checkOutTime,
      originalTotalHours: attendance.totalHours,
      originalStatus: attendance.status,
      correctedCheckInTime,
      correctedCheckOutTime,
      correctedTotalHours,
      correctedStatus,
      reason,
      department: attendance.department,
      status: 'pending',
      currentApprovalLevel: 0,
      totalApprovalsRequired,
      submittedBy: employeeId,
    });

    await timeCorrection.save();
    await timeCorrection.populate('employee', 'firstName lastName email role department');

    res.status(201).json({
      success: true,
      message: 'Time correction request submitted successfully',
      data: timeCorrection,
    });
  } catch (error) {
    console.error('Submit time correction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting time correction',
      error: error.message,
    });
  }
};

/**
 * GET /api/time-correction/pending-approvals
 * Get pending time correction requests for current user to approve
 * Based on their role and position in approval chain
 */
exports.getPendingApprovals = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const userDepartment = req.user.department;

    // Query for any non-final status (pending or intermediate approvals)
    let query = { status: { $in: ['pending', 'approved_by_hr_staff', 'approved_by_hr_head', 'approved_by_supervisor'] } };

    if (userRole === 'supervisor') {
      // Supervisor approves: HR Head time corrections (any approval level)
      query.submittedBy = await User.find({ role: 'hr_head' }).select('_id');
      query.submittedBy = { $in: query.submittedBy.map(u => u._id) };
    } else if (userRole === 'hr_head') {
      // HR Head approves:
      // 1. HR Staff corrections (at approval level 0 or 1)
      // 2. Employee corrections (at approval level 1 - after HR Staff approval)
      const conditions = [];
      
      // HR Staff corrections
      const hrStaffUsers = await User.find({ role: 'hr_staff' }).select('_id');
      conditions.push({
        submittedBy: { $in: hrStaffUsers.map(u => u._id) },
        currentApprovalLevel: { $in: [0, 1] },
      });
      
      // Employee corrections (at approval level 1 - after HR Staff approval)
      const employeeUsers = await User.find({ role: 'employee' }).select('_id');
      conditions.push({
        submittedBy: { $in: employeeUsers.map(u => u._id) },
        currentApprovalLevel: 1,
      });

      query = { $and: [{ status: { $in: ['pending', 'approved_by_hr_staff', 'approved_by_hr_head', 'approved_by_supervisor'] } }, { $or: conditions }] };
    } else if (userRole === 'hr_staff') {
      // HR Staff approves:
      // 1. All employee corrections (at approval level 0 - first approval)
      const employeeUsers = await User.find({ 
        role: 'employee',
      }).select('_id');
      
      query = {
        status: { $in: ['pending', 'approved_by_hr_staff', 'approved_by_hr_head', 'approved_by_supervisor'] },
        submittedBy: { $in: employeeUsers.map(u => u._id) },
        currentApprovalLevel: 0,
      };
    }

    const pendingCorrections = await TimeCorrection.find(query)
      .populate('employee', 'firstName lastName email role department')
      .populate('attendanceRecord')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: pendingCorrections,
      total: pendingCorrections.length,
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending approvals',
      error: error.message,
    });
  }
};

/**
 * POST /api/time-correction/:id/approve
 * Approve a time correction request
 */
exports.approveTimeCorrection = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const approverId = req.user.id;
    const approverRole = req.user.role;

    const timeCorrection = await TimeCorrection.findById(id);
    if (!timeCorrection) {
      return res.status(404).json({
        success: false,
        message: 'Time correction request not found',
      });
    }

    // Check if already fully approved or rejected (but allow intermediate approvals)
    if (timeCorrection.status === 'approved' || timeCorrection.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: `This request is already ${timeCorrection.status}`,
      });
    }

    // Add approval to chain
    timeCorrection.approvals.push({
      approver: approverId,
      approverRole,
      approverName: req.user.firstName + ' ' + req.user.lastName,
      action: 'approved',
      comments,
      approvedAt: new Date(),
    });

    timeCorrection.currentApprovalLevel += 1;

    // Check if all approvals are complete
    if (timeCorrection.currentApprovalLevel >= timeCorrection.totalApprovalsRequired) {
      timeCorrection.status = 'approved';
      timeCorrection.approvedAt = new Date();

      // Update the attendance record with corrected times
      const attendance = await Attendance.findById(timeCorrection.attendanceRecord);
      if (attendance) {
        attendance.checkInTime = timeCorrection.correctedCheckInTime;
        attendance.checkOutTime = timeCorrection.correctedCheckOutTime;
        attendance.totalHours = timeCorrection.correctedTotalHours;
        attendance.status = timeCorrection.correctedStatus;
        await attendance.save();
      }
    } else {
      // Update status to show who approved it
      const approverRole = req.user.role === 'hr_staff' ? 'HR Staff' : req.user.role === 'hr_head' ? 'HR Head' : 'Supervisor';
      timeCorrection.status = `approved_by_${approverRole.toLowerCase().replace(' ', '_')}`;
    }

    await timeCorrection.save();
    await timeCorrection.populate('employee', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: timeCorrection.status === 'approved' ? 'Time correction approved and applied' : 'Approval recorded, awaiting further approval',
      data: timeCorrection,
    });
  } catch (error) {
    console.error('Approve time correction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving time correction',
      error: error.message,
    });
  }
};

/**
 * POST /api/time-correction/:id/reject
 * Reject a time correction request
 */
exports.rejectTimeCorrection = async (req, res) => {
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

    const timeCorrection = await TimeCorrection.findById(id);
    if (!timeCorrection) {
      return res.status(404).json({
        success: false,
        message: 'Time correction request not found',
      });
    }

    // Check if already fully approved or rejected (but allow intermediate rejections)
    if (timeCorrection.status === 'approved' || timeCorrection.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: `This request is already ${timeCorrection.status}`,
      });
    }

    // Record rejection
    timeCorrection.approvals.push({
      approver: rejecterId,
      approverRole: rejecterRole,
      approverName: req.user.firstName + ' ' + req.user.lastName,
      action: 'rejected',
      comments: rejectionReason,
      approvedAt: new Date(),
    });

    timeCorrection.status = 'rejected';
    timeCorrection.rejectedAt = new Date();
    timeCorrection.rejectionReason = rejectionReason;

    await timeCorrection.save();
    await timeCorrection.populate('employee', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Time correction request rejected',
      data: timeCorrection,
    });
  } catch (error) {
    console.error('Reject time correction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting time correction',
      error: error.message,
    });
  }
};

/**
 * GET /api/time-correction/my-requests
 * Get all time correction requests submitted by current user
 */
exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await TimeCorrection.find({ submittedBy: userId })
      .populate('attendanceRecord')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
      total: requests.length,
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching requests',
      error: error.message,
    });
  }
};

/**
 * GET /api/time-correction/history
 * Get correction history
 * - Employees (marketing/treasury): see only their own corrections
 * - HR Staff, HR Head, Supervisors: see all corrections
 */
exports.getCorrectionHistory = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const userDepartment = req.user.department;

    let query = {};

    // Employees only see their own corrections
    if (userRole === 'employee') {
      query.employee = userId;
    }
    // HR Staff, HR Head, and Supervisors see all corrections

    const corrections = await TimeCorrection.find(query)
      .populate('employee', 'firstName lastName email role department')
      .populate('attendanceRecord')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: corrections,
      total: corrections.length,
    });
  } catch (error) {
    console.error('Get correction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching correction history',
      error: error.message,
    });
  }
};
