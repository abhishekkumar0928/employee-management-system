const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true
  },
  payableDays: {
    type: Number,
    required: true,
    default: 0
  },
  attendanceSalary: {
    type: Number,
    required: true,
    default: 0
  },
  overtimePay: {
    type: Number,
    required: true,
    default: 0
  },
  advanceDeduction: {
    type: Number,
    required: true,
    default: 0
  },
  unpaidLeaveDeduction: {
    type: Number,
    required: true,
    default: 0
  },
  netSalary: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Paid', 'Unpaid'],
    default: 'Unpaid'
  },
  paidAt: {
    type: Date,
    default: null
  },
  attendanceSummary: {
    presentCount: { type: Number, default: 0 },
    absentCount: { type: Number, default: 0 },
    halfDayCount: { type: Number, default: 0 },
    paidLeaveCount: { type: Number, default: 0 },
    sickLeaveCount: { type: Number, default: 0 },
    casualLeaveCount: { type: Number, default: 0 },
    holidayCount: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Ensure a single payroll record per employee per month/year
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

const Payroll = mongoose.model('Payroll', payrollSchema);
module.exports = Payroll;
