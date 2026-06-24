const Overtime = require('../models/Overtime');
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

// @desc    Submit an overtime request
// @route   POST /api/overtime
// @access  Private (Employee, HR Manager, Super Admin)
const logOvertime = async (req, res) => {
  try {
    const { employeeId, date, hours, reason } = req.body;

    let targetEmployee;
    if (req.user.role === 'Employee') {
      if (!req.user.employee) {
        return res.status(400).json({ message: 'User is not linked to an Employee record' });
      }
      targetEmployee = req.user.employee._id;
    } else {
      if (!employeeId) {
        return res.status(400).json({ message: 'Please specify an employee ID' });
      }
      targetEmployee = employeeId;
    }

    if (!date || !hours || !reason) {
      return res.status(400).json({ message: 'Please provide all details' });
    }

    const otDate = getMidnightDate(date);
    const ot = await Overtime.create({
      employee: targetEmployee,
      date: otDate,
      hours: parseFloat(hours),
      reason,
      status: req.user.role === 'Employee' ? 'Pending' : 'Approved' // auto-approve if submitted by Admin/HR
    });

    return res.status(201).json(ot);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get overtime records list
// @route   GET /api/overtime
// @access  Private
const getOvertime = async (req, res) => {
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

    const otRecords = await Overtime.find(query).populate('employee').sort({ date: -1 });
    return res.status(200).json(otRecords);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update overtime request status (Approve / Reject)
// @route   PUT /api/overtime/:id/status
// @access  Private (Super Admin, HR Manager)
const updateOvertimeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const ot = await Overtime.findById(req.params.id);
    if (!ot) {
      return res.status(404).json({ message: 'Overtime record not found' });
    }

    if (ot.status !== 'Pending') {
      return res.status(400).json({ message: `Overtime record has already been ${ot.status.toLowerCase()}` });
    }

    ot.status = status;
    await ot.save();

    return res.status(200).json(ot);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  logOvertime,
  getOvertime,
  updateOvertimeStatus
};
