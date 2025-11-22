const mongoose = require('mongoose');

const gasPricingSchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'PHP',
    },
    effectiveDate: {
      type: Date,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    priceHistory: [
      {
        price: Number,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Keep only latest price for current display
gasPricingSchema.index({ effectiveDate: -1 });
gasPricingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('GasPricing', gasPricingSchema);
