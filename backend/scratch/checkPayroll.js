const mongoose = require('mongoose');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const dotenv = require('dotenv');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/employee_management');
    console.log('Connected to DB');

    // Find all payroll records
    const records = await Payroll.find().populate('employee');
    console.log('Total payroll records:', records.length);
    if (records.length > 0) {
      console.log('First record employee field type:', typeof records[0].employee);
      console.log('First record entire details:', records[0]);
    } else {
      console.log('No payroll records found in database.');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
