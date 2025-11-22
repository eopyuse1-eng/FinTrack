const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    leaveType: {
      type: String,
      enum: ['sick', 'vacation', 'personal', 'bereavement', 'emergency', 'other'],
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    numberOfDays: {
      type: Number,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved_by_supervisor', 'approved_by_hr_staff', 'approved_by_hr_head', 'approved', 'rejected'],
      default: 'pending',
    },
    currentApprovalLevel: {
      type: Number,
      default: 0,
    },
    totalApprovalsRequired: {
      type: Number,
      default: 2,
    },
    approvals: [
      {
        approver: mongoose.Schema.Types.ObjectId,
        approverRole: String,
        approverName: String,
        action: {
          type: String,
          enum: ['approved', 'rejected'],
        },
        comments: String,
        approvedAt: Date,
      },
    ],
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedAt: Date,
    rejectedAt: Date,
    rejectionReason: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
leaveSchema.index({ employee: 1, status: 1 });
leaveSchema.index({ department: 1, status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = { Leave };
