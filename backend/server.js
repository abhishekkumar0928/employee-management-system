const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

connectDB();
const app = express();

// Middlewares
app.use(cors());
// Set body payload size limits to support base64 employee photos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Test Route
app.get('/', (req, res) => {
  res.send('Employee Management & Payroll System API is running...');
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/overtime', require('./routes/overtimeRoutes'));
app.use('/api/advance', require('./routes/advanceRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));
app.use('/api/holidays', require('./routes/holidayRoutes'));

// Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
