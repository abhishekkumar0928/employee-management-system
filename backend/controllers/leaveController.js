const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// Helper to normalize to UTC midnight (timezone-robust)
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

// @desc    Apply for a leave
// @route   POST /api/leaves
// @access  Private (Employee)
const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!req.user.employee) {
      return res.status(400).json({ message: 'User is not linked to an Employee record' });
    }

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'Please provide all details' });
    }

    const start = getMidnightDate(startDate);
    const end = getMidnightDate(endDate);

    if (start > end) {
      return res.status(400).json({ message: 'Start date cannot be after end date' });
    }

    // Check for existing overlapping leave requests
    const overlap = await Leave.findOne({
      employee: req.user.employee._id,
      status: { $in: ['Pending', 'Approved'] },
      $or: [
        { startDate: { $gte: start, $lte: end } },
        { endDate: { $gte: start, $lte: end } },
        { startDate: { $lte: start }, endDate: { $gte: end } }
      ]
    });

    if (overlap) {
      return res.status(400).json({ message: 'An overlapping leave request already exists for these dates' });
    }

    const leave = await Leave.create({
      employee: req.user.employee._id,
      leaveType,
      startDate: start,
      endDate: end,
      reason
    });

    return res.status(201).json(leave);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get leaves list (All for Admin/HR, Self for Employee)
// @route   GET /api/leaves
// @access  Private
const getLeaves = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    let query = {};

    if (req.user.role === 'Employee') {
      query.employee = req.user.employee._id;
    } else {
      if (employeeId) {
        query.employee = employeeId;
      }
    }

    if (status) {
      query.status = status;
    }

    const leaves = await Leave.find(query).populate('employee').sort({ createdAt: -1 });
    return res.status(200).json(leaves);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update leave status (Approve / Reject)
// @route   PUT /api/leaves/:id/status
// @access  Private (Super Admin, HR Manager)
const updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body; // Approved or Rejected
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status update' });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave record not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ message: `Leave has already been ${leave.status.toLowerCase()}` });
    }

    leave.status = status;
    await leave.save();

    // If Approved, insert corresponding Attendance records automatically
    if (status === 'Approved') {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      // Loop through all dates in range and record leave attendance
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const targetDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
        
        let statusVal = 'Paid Leave';
        if (leave.leaveType === 'Sick Leave') {
          statusVal = 'Sick Leave';
        } else if (leave.leaveType === 'Emergency Leave') {
          statusVal = 'Casual Leave';
        }

        // Upsert attendance record for that day
        await Attendance.findOneAndUpdate(
          { employee: leave.employee, date: targetDate },
          { status: statusVal, overtimeHours: 0 },
          { upsert: true, new: true }
        );
      }
    }

    return res.status(200).json(leave);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get leave balance & allowance metrics
// @route   GET /api/leaves/balances/:employeeId
// @access  Private (Self, Super Admin, HR Manager)
const getLeaveBalances = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (req.user.role === 'Employee' && req.user.employee?._id.toString() !== employeeId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Set standard yearly limits
    const limits = {
      'Paid Leave': 12,
      'Sick Leave': 10,
      'Emergency Leave': 8
    };

    // Calculate taken leaves in current year
    const startOfYear = new Date(Date.UTC(new Date().getFullYear(), 0, 1));
    const endOfYear = new Date(Date.UTC(new Date().getFullYear(), 11, 31, 23, 59, 59, 999));

    const approvedLeaves = await Leave.find({
      employee: employeeId,
      status: 'Approved',
      startDate: { $gte: startOfYear, $lte: endOfYear }
    });

    const taken = {
      'Paid Leave': 0,
      'Sick Leave': 0,
      'Emergency Leave': 0
    };

    approvedLeaves.forEach(leave => {
      // Calculate days in the date range
      const diffTime = Math.abs(leave.endDate - leave.startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
      
      if (taken[leave.leaveType] !== undefined) {
        taken[leave.leaveType] += diffDays;
      }
    });

    const balances = {
      paidLeave: { allowed: limits['Paid Leave'], taken: taken['Paid Leave'], balance: Math.max(0, limits['Paid Leave'] - taken['Paid Leave']) },
      sickLeave: { allowed: limits['Sick Leave'], taken: taken['Sick Leave'], balance: Math.max(0, limits['Sick Leave'] - taken['Sick Leave']) },
      emergencyLeave: { allowed: limits['Emergency Leave'], taken: taken['Emergency Leave'], balance: Math.max(0, limits['Emergency Leave'] - taken['Emergency Leave']) }
    };

    return res.status(200).json(balances);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  applyLeave,
  getLeaves,
  updateLeaveStatus,
  getLeaveBalances
};
