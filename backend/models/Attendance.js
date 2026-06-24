const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true // YYYY-MM-DD formatted date (normalized)
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Half Day', 'Paid Leave', 'Sick Leave', 'Casual Leave', 'Holiday'],
    required: true
  },
  overtimeHours: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate attendance logs for same employee on same date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
