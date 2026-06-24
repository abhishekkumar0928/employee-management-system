const mongoose = require('mongoose');
const { getDashboardStats } = require('../controllers/attendanceController');
const dotenv = require('dotenv');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/employee_management');
    console.log('Connected to DB');

    // Mock Express req/res
    const req = {};
    const res = {
      statusCode: 200,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        console.log('Controller returned code:', this.statusCode);
        console.log('Controller JSON output:', data);
      }
    };

    await getDashboardStats(req, res);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
