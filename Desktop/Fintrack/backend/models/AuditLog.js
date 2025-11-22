const mongoose = require('mongoose');

// Audit log types
const LOG_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  FAILED_LOGIN: 'failed_login',
  ACCOUNT_LOCKED: 'account_locked',
  REGISTRATION: 'registration',
  PASSWORD_CHANGE: 'password_change',
};

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for failed logins
    },
    email: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(LOG_TYPES),
      required: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success',
    },
    reason: {
      type: String,
      default: null, // Reason for failure if applicable
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // Only use createdAt
  }
);

// Index for querying logs by user and date
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ email: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = { AuditLog, LOG_TYPES };
