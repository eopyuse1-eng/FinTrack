const mongoose = require('mongoose');

/**
 * VerificationCode Schema
 * Stores email verification codes for users who've completed Google OAuth
 * After verification, user can login with email+code combination
 */
const verificationCodeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    code: {
      type: String,
      required: true,
      // 6-digit code
      minlength: 6,
      maxlength: 6,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      // Auto-delete after expiration (TTL index set below)
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete verification codes after expiration
verificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const VerificationCode = mongoose.model('VerificationCode', verificationCodeSchema);

module.exports = { VerificationCode };
