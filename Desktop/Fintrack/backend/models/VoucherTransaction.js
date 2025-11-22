const mongoose = require('mongoose');

/**
 * VoucherTransaction Schema
 * Tracks each voucher usage/transaction for audit trail
 */
const voucherTransactionSchema = new mongoose.Schema(
  {
    voucher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
      required: true,
    },
    
    transactionType: {
      type: String,
      enum: ['used', 'expired', 'replenished', 'created', 'returned'],
      required: true,
    },
    
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    
    // Related to employee/user if voucher was used by them
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    
    // Reference to expense/trip/etc if applicable
    referenceId: {
      type: String,
      default: null,
    },
    referenceType: {
      type: String,
      enum: ['expense', 'trip', 'meal', 'equipment', 'other'],
      default: null,
    },
    
    // Details
    description: String,
    notes: String,
    
    // Approval tracking
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    
    // Recorded by
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
voucherTransactionSchema.index({ voucher: 1, transactionType: 1 });
voucherTransactionSchema.index({ usedBy: 1, createdAt: -1 });
voucherTransactionSchema.index({ recordedBy: 1, createdAt: -1 });

const VoucherTransaction = mongoose.model('VoucherTransaction', voucherTransactionSchema);

module.exports = { VoucherTransaction };
