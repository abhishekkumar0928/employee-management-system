const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const runTests = async () => {
  try {
    console.log('Starting schemas verification...');
    
    // Connect to test database
    const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/employee_management';
    console.log(`Connecting to database: ${connStr}`);
    await mongoose.connect(connStr);
    console.log('Database connected successfully.');

    // 1. Clear test user
    console.log('Verifying User model integrity...');
    const originalCount = await User.countDocuments();
    console.log(`Current users in DB: ${originalCount}`);
    
    // Attempt creation
    const tempUsername = `test_admin_${Date.now()}`;
    const testUser = await User.create({
      username: tempUsername,
      password: 'testpassword123',
      role: 'Super Admin'
    });
    
    console.log(`Test user created: ${testUser.username}`);
    
    // Verify password matching
    const match = await testUser.matchPassword('testpassword123');
    console.log(`Password match verification: ${match ? 'PASSED' : 'FAILED'}`);
    
    if (!match) throw new Error('Password hashing verification failed!');

    // Cleanup
    await User.findByIdAndDelete(testUser._id);
    console.log('Test user cleaned up.');

    // 2. Verify Employee schema
    console.log('Verifying Employee model integrity...');
    const empId = `TEST_${Math.floor(1000 + Math.random() * 9000)}`;
    const emp = await Employee.create({
      employeeId: empId,
      fullName: 'Verification Test User',
      gender: 'Male',
      contactNumber: '0000000000',
      email: `verify_${Date.now()}@company.com`,
      address: 'Test Address',
      joiningDate: new Date(),
      department: 'Engineering',
      bankName: 'Test Bank',
      accountNumber: '1234567890',
      ifscCode: 'TEST0001',
      monthlySalary: 50000,
      overtimeRate: 200
    });
    console.log(`Test employee created: ${emp.fullName} (${emp.employeeId})`);
    
    // Cleanup
    await Employee.findByIdAndDelete(emp._id);
    console.log('Test employee cleaned up.');

    // 3. Verify Payroll schema
    console.log('Verifying Payroll model integrity...');
    const Payroll = require('../models/Payroll');
    const testPayroll = await Payroll.create({
      employee: new mongoose.Types.ObjectId(),
      month: 6,
      year: 2026,
      basicSalary: 35000,
      payableDays: 23,
      attendanceSalary: 26833.41,
      overtimePay: 2000,
      advanceDeduction: 4500,
      unpaidLeaveDeduction: 8166.59,
      netSalary: 24333.41,
      status: 'Unpaid'
    });
    console.log(`Test payroll created: basic=${testPayroll.basicSalary}, payableDays=${testPayroll.payableDays}, netSalary=${testPayroll.netSalary}`);
    
    // Cleanup
    await Payroll.findByIdAndDelete(testPayroll._id);
    console.log('Test payroll cleaned up.');

    console.log('ALL DB SCHEMA TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('TESTING FAILED:', error.message);
    process.exit(1);
  }
};

runTests();
