const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      },
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['present', 'late', 'absent', 'checked-out'],
      default: 'absent',
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    department: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index to ensure only one attendance record per employee per day
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = { Attendance: mongoose.model('Attendance', AttendanceSchema) };
