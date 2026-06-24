const AdvanceSalary = require('../models/AdvanceSalary');
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

// @desc    Record an advance salary request/grant
// @route   POST /api/advance
// @access  Private (Super Admin, HR Manager)
const requestAdvance = async (req, res) => {
  try {
    const { employeeId, amount, date, reason } = req.body;

    if (!employeeId || !amount || !date || !reason) {
      return res.status(400).json({ message: 'Please provide all details' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const targetDate = getMidnightDate(date);
    const advance = await AdvanceSalary.create({
      employee: employeeId,
      amount: parseFloat(amount),
      date: targetDate,
      reason,
      remainingBalance: parseFloat(amount)
    });

    return res.status(201).json(advance);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get advance salary records list (filtered by employee)
// @route   GET /api/advance
// @access  Private
const getAdvanceLogs = async (req, res) => {
  try {
    const { employeeId } = req.query;
    let query = {};

    if (req.user.role === 'Employee') {
      query.employee = req.user.employee._id;
    } else {
      if (employeeId) {
        query.employee = employeeId;
      }
    }

    const logs = await AdvanceSalary.find(query).populate('employee').sort({ date: -1 });
    return res.status(200).json(logs);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get remaining advance salary balance for an employee
// @route   GET /api/advance/balance/:employeeId
// @access  Private
const getRemainingBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (req.user.role === 'Employee' && req.user.employee?._id.toString() !== employeeId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const logs = await AdvanceSalary.find({ employee: employeeId, remainingBalance: { $gt: 0 } });
    const totalRemaining = logs.reduce((sum, log) => sum + log.remainingBalance, 0);

    return res.status(200).json({ remainingBalance: totalRemaining });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  requestAdvance,
  getAdvanceLogs,
  getRemainingBalance
};
