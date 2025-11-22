const mongoose = require('mongoose');

const timeCorrectionSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attendanceRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      required: true,
    },
    correctionDate: {
      type: Date,
      required: true, // Date of attendance being corrected
    },
    // Original times
    originalCheckInTime: Date,
    originalCheckOutTime: Date,
    originalTotalHours: Number,
    originalStatus: String,
    // Corrected times
    correctedCheckInTime: Date,
    correctedCheckOutTime: Date,
    correctedTotalHours: Number,
    correctedStatus: String,
    // Reason for correction
    reason: {
      type: String,
      required: true,
    },
    // Department of the employee
    department: {
      type: String,
      required: true,
    },
    // Status: pending, approved_by_hr_staff, approved_by_hr_head, approved_by_supervisor, approved, rejected
    status: {
      type: String,
      enum: ['pending', 'approved_by_hr_staff', 'approved_by_hr_head', 'approved_by_supervisor', 'approved', 'rejected'],
      default: 'pending',
    },
    // Approval chain
    approvals: [
      {
        approver: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        approverRole: String,
        approverName: String,
        action: {
          type: String,
          enum: ['approved', 'rejected'],
        },
        comments: String,
        approvedAt: {
          type: Date,
          default: null,
        },
      },
    ],
    // Current approval level (0 = first approver, 1 = second approver, etc.)
    currentApprovalLevel: {
      type: Number,
      default: 0,
    },
    // Total approvals required based on role
    totalApprovalsRequired: {
      type: Number,
      default: 1,
    },
    // Submitted by
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    // Final approval date
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: String,
  },
  {
    timestamps: true,
  }
);

// Index for querying pending approvals
timeCorrectionSchema.index({ status: 1, 'currentApprovalLevel': 1 });
timeCorrectionSchema.index({ employee: 1, correctionDate: 1 });
timeCorrectionSchema.index({ submittedBy: 1, createdAt: -1 });

const TimeCorrection = mongoose.model('TimeCorrection', timeCorrectionSchema);

module.exports = { TimeCorrection };
