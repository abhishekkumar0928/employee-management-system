const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');

// Normalize date to UTC midnight (timezone-robust)
const getMidnightDate = (dateStr) => {
  if (!dateStr) return new Date();
  
  if (dateStr instanceof Date) {
    const y = dateStr.getFullYear();
    const m = dateStr.getMonth();
    const d = dateStr.getDate();
    return new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
  }
  
  if (typeof dateStr === 'string') {
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const y = parseInt(match[1], 10);
      const m = parseInt(match[2], 10) - 1;
      const d = parseInt(match[3], 10);
      return new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
    }
  }

  const parsed = new Date(dateStr);
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 0, 0, 0, 0));
};

// @desc    Log or update bulk attendance for a date
// @route   POST /api/attendance/bulk
// @access  Private (Super Admin, HR Manager)
const logAttendance = async (req, res) => {
  try {
    const { date, records } = req.body; // date: YYYY-MM-DD, records: [{ employeeId, status, overtimeHours }]

    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Invalid payload parameters' });
    }

    const targetDate = getMidnightDate(date);
    const results = [];

    for (const record of records) {
      const { employeeId, status, overtimeHours } = record;

      // Upsert attendance record
      const attRecord = await Attendance.findOneAndUpdate(
        { employee: employeeId, date: targetDate },
        { 
          status, 
          overtimeHours: overtimeHours || 0 
        },
        { new: true, upsert: true }
      );
      results.push(attRecord);
    }

    return res.status(200).json({
      message: 'Attendance saved successfully',
      date: targetDate,
      count: results.length
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance records for a specific date
// @route   GET /api/attendance/date/:dateString
// @access  Private (Super Admin, HR Manager)
const getAttendanceByDate = async (req, res) => {
  try {
    const targetDate = getMidnightDate(req.params.dateString);
    const attendance = await Attendance.find({ date: targetDate }).populate('employee');
    return res.status(200).json(attendance);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance logs for an employee (filtered by month and year)
// @route   GET /api/attendance/employee/:employeeId
// @access  Private (Self, Super Admin, HR Manager)
const getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query; // month is 1-indexed (1-12)

    // Check authorization: Employees can only view their own records
    if (req.user.role === 'Employee' && req.user.employee?._id.toString() !== employeeId) {
      return res.status(403).json({ message: 'Not authorized to view other employee records' });
    }

    let filter = { employee: employeeId };

    if (month && year) {
      const m = parseInt(month) - 1;
      const y = parseInt(year);
      const start = new Date(Date.UTC(y, m, 1));
      const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
      filter.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(filter).sort({ date: 1 });
    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get aggregate dashboard stats
// @route   GET /api/attendance/dashboard-stats
// @access  Private (Super Admin, HR Manager)
const getDashboardStats = async (req, res) => {
  try {
    // Total employees
    const activeEmployeesCount = await Employee.countDocuments({ status: 'Active' });
    const totalEmployeesCount = await Employee.countDocuments();

    // Today's Date normalized
    const today = getMidnightDate(req.query.date || new Date());

    // Today's attendance list
    const attendanceToday = await Attendance.find({ date: today });
    const presentToday = attendanceToday.filter(a => a.status === 'Present' || a.status === 'Half Day').length;
    const absentToday = attendanceToday.filter(a => a.status === 'Absent').length;
    const leaveToday = attendanceToday.filter(a => ['Paid Leave', 'Sick Leave', 'Casual Leave'].includes(a.status)).length;

    // Aggregate monthly payroll summary (last generated payroll)
    const recentPayrolls = await Payroll.find().sort({ createdAt: -1 }).limit(10).populate('employee');
    const totalSalaryExpense = recentPayrolls.reduce((sum, p) => sum + p.netSalary, 0);

    return res.status(200).json({
      activeEmployees: activeEmployeesCount,
      totalEmployees: totalEmployeesCount,
      presentToday,
      absentToday,
      leaveToday,
      totalSalaryExpense
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  logAttendance,
  getAttendanceByDate,
  getEmployeeAttendance,
  getDashboardStats
};
