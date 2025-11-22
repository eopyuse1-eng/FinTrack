const mongoose = require('mongoose');

const unlockRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: true,
    maxLength: 500,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // HR Head who reviewed this request
  },
  reviewComment: {
    type: String,
    default: null,
  },
  passwordReset: {
    type: Boolean,
    default: false, // Whether password should be reset along with unlock
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model('UnlockRequest', unlockRequestSchema);
