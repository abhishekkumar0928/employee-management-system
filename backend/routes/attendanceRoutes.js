const express = require('express');
const router = express.Router();
const {
  logAttendance,
  getAttendanceByDate,
  getEmployeeAttendance,
  getDashboardStats
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/bulk', protect, authorize('Super Admin', 'HR Manager'), logAttendance);
router.get('/date/:dateString', protect, authorize('Super Admin', 'HR Manager'), getAttendanceByDate);
router.get('/employee/:employeeId', protect, getEmployeeAttendance);
router.get('/dashboard-stats', protect, authorize('Super Admin', 'HR Manager'), getDashboardStats);

module.exports = router;
