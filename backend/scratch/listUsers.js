const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/employee_management');
    console.log('Connected to DB');

    const users = await User.find().select('-password');
    console.log('Current User Accounts:');
    users.forEach(u => {
      console.log(`- Username: ${u.username} | Role: ${u.role} | Employee Link: ${u.employee ? 'Yes' : 'No'}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
