const mongoose = require('mongoose');

/**
 * Voucher Schema
 * Represents physical/digital vouchers for treasury operations
 * Tracks stock, creation, usage, and status
 */
const voucherSchema = new mongoose.Schema(
  {
    // Identification
    voucherCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      // Format: VOUCH-XXXX-YYYY (e.g., VOUCH-0001-2024)
    },
    voucherType: {
      type: String,
      enum: ['travel', 'meal', 'accommodation', 'equipment', 'other'],
      required: true,
    },
    
    // Stock Management
    totalStock: {
      type: Number,
      required: true,
      min: 1,
    },
    availableStock: {
      type: Number,
      required: true,
      min: 0,
    },
    usedStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiredStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Value & Pricing
    voucherValue: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'PHP',
      enum: ['PHP', 'USD', 'EUR'],
    },
    
    // Validity Period
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    
    // Status & Details
    status: {
      type: String,
      enum: ['active', 'paused', 'archived'],
      default: 'active',
    },
    description: String,
    
    // Low Stock Alert Threshold
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 1,
    },
    
    // Created By
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Audit Trail
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastModifiedAt: Date,
  },
  {
    timestamps: true,
  }
);

/**
 * Schema Methods
 */

// Check if stock is low
voucherSchema.methods.isLowStock = function() {
  return this.availableStock <= this.lowStockThreshold;
};

// Check if voucher is expired
voucherSchema.methods.isExpired = function() {
  return new Date() > this.validUntil;
};

// Get stock percentage
voucherSchema.methods.getStockPercentage = function() {
  return Math.round((this.availableStock / this.totalStock) * 100);
};

// Deduct stock when voucher is used
voucherSchema.methods.useVoucher = async function(quantity = 1) {
  if (this.availableStock < quantity) {
    throw new Error(`Insufficient stock. Available: ${this.availableStock}, Requested: ${quantity}`);
  }
  
  if (this.isExpired()) {
    throw new Error('Voucher has expired');
  }
  
  this.availableStock -= quantity;
  this.usedStock += quantity;
  return this.save();
};

// Replenish stock
voucherSchema.methods.replenishStock = async function(quantity, modifiedBy) {
  this.totalStock += quantity;
  this.availableStock += quantity;
  this.lastModifiedBy = modifiedBy;
  this.lastModifiedAt = new Date();
  return this.save();
};

// Expire vouchers
voucherSchema.methods.expireVouchers = async function(quantity) {
  if (this.availableStock < quantity) {
    throw new Error(`Cannot expire ${quantity} vouchers. Only ${this.availableStock} available`);
  }
  
  this.availableStock -= quantity;
  this.expiredStock += quantity;
  return this.save();
};

const Voucher = mongoose.model('Voucher', voucherSchema);

module.exports = { Voucher };
