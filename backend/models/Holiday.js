const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    unique: true
  },
  isCustom: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Holiday = mongoose.model('Holiday', holidaySchema);
module.exports = Holiday;
