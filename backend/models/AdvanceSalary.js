const mongoose = require('mongoose');

const advanceSalarySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  date: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  remainingBalance: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

const AdvanceSalary = mongoose.model('AdvanceSalary', advanceSalarySchema);
module.exports = AdvanceSalary;
