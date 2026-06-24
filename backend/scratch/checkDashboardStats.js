const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');
const dotenv = require('dotenv');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/employee_management');
    console.log('Connected to DB');

    const totalEmps = await Employee.countDocuments();
    const activeEmps = await Employee.countDocuments({ status: 'Active' });
    console.log('Employee countDocuments:', { totalEmps, activeEmps });

    const allEmps = await Employee.find();
    console.log('Employee find() count:', allEmps.length);
    if (allEmps.length > 0) {
      console.log('Sample Employee status:', allEmps[0].status, typeof allEmps[0].status);
    }

    const todayStr = new Date().toISOString().substring(0, 10);
    const d = new Date(todayStr);
    const todayUTC = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
    console.log('Normalized Today UTC:', todayUTC);

    const attToday = await Attendance.find({ date: todayUTC });
    console.log('Attendance today count:', attToday.length);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
