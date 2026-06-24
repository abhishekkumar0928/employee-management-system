const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Overtime = require('../models/Overtime');
const AdvanceSalary = require('../models/AdvanceSalary');

// @desc    Generate payroll records (status 'Unpaid') for all active employees for a specific month/year
// @route   POST /api/payroll/generate
// @access  Private (Super Admin, HR Manager)
const generatePayroll = async (req, res) => {
  try {
    const { month, year } = req.body; // month: 1-12, year: 2026

    if (!month || !year) {
      return res.status(400).json({ message: 'Please specify month and year' });
    }

    const employees = await Employee.find({ status: 'Active' });
    const payrollRecords = [];

    // Date range for the target month
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    for (const emp of employees) {
      // 1. Fetch attendance records
      const attendance = await Attendance.find({
        employee: emp._id,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      });

      const stats = {
        presentCount: 0,
        absentCount: 0,
        halfDayCount: 0,
        paidLeaveCount: 0,
        sickLeaveCount: 0,
        casualLeaveCount: 0,
        holidayCount: 0,
        overtimeHours: 0
      };

      attendance.forEach(att => {
        if (att.status === 'Present') stats.presentCount++;
        else if (att.status === 'Absent') stats.absentCount++;
        else if (att.status === 'Half Day') stats.halfDayCount++;
        else if (att.status === 'Paid Leave') stats.paidLeaveCount++;
        else if (att.status === 'Sick Leave') stats.sickLeaveCount++;
        else if (att.status === 'Casual Leave') stats.casualLeaveCount++;
        else if (att.status === 'Holiday') stats.holidayCount++;
      });

      // 2. Calculate Daily Salary and Payable Days
      const dailySalary = emp.monthlySalary / 30;
      
      const presentDays = stats.presentCount;
      const paidLeaveDays = stats.paidLeaveCount + stats.casualLeaveCount;
      const sickLeaveDays = stats.sickLeaveCount;
      const approvedHolidays = stats.holidayCount;
      const halfDays = stats.halfDayCount * 0.5;

      const payableDays = presentDays + paidLeaveDays + sickLeaveDays + approvedHolidays + halfDays;
      const attendanceSalary = parseFloat((dailySalary * payableDays).toFixed(2));

      // Unpaid Leave Deduction (difference from Monthly Base Salary)
      const unpaidLeaveDeduction = parseFloat(Math.max(0, emp.monthlySalary - attendanceSalary).toFixed(2));

      // 3. Fetch approved overtime hours for this month
      const approvedOvertime = await Overtime.find({
        employee: emp._id,
        status: 'Approved',
        date: { $gte: startOfMonth, $lte: endOfMonth }
      });
      const totalOvertimeHours = approvedOvertime.reduce((sum, ot) => sum + ot.hours, 0);
      stats.overtimeHours = totalOvertimeHours;
      const overtimePay = parseFloat((totalOvertimeHours * emp.overtimeRate).toFixed(2));

      // 4. Calculate Advance Salary Deduction
      const activeAdvances = await AdvanceSalary.find({
        employee: emp._id,
        remainingBalance: { $gt: 0 }
      });
      const totalOutstandingAdvance = activeAdvances.reduce((sum, adv) => sum + adv.remainingBalance, 0);

      // Base net salary before advance deduction
      const salaryBeforeAdvance = attendanceSalary + overtimePay;
      
      // We deduct outstanding advance, but Net Salary cannot go below zero
      const advanceDeduction = parseFloat(Math.min(totalOutstandingAdvance, Math.max(0, salaryBeforeAdvance)).toFixed(2));
      const netSalary = parseFloat(Math.max(0, salaryBeforeAdvance - advanceDeduction).toFixed(2));

      // 5. Create or Update the Payroll record
      // If it is already marked as 'Paid', skip overwriting it to prevent data loss
      const existingPaid = await Payroll.findOne({
        employee: emp._id,
        month,
        year,
        status: 'Paid'
      });

      if (existingPaid) {
        continue; // Keep the locked paid record
      }

      const payroll = await Payroll.findOneAndUpdate(
        { employee: emp._id, month, year },
        {
          basicSalary: emp.monthlySalary,
          payableDays,
          attendanceSalary,
          overtimePay,
          advanceDeduction,
          unpaidLeaveDeduction,
          netSalary,
          status: 'Unpaid',
          attendanceSummary: stats
        },
        { upsert: true, new: true }
      );

      payrollRecords.push(payroll);
    }

    return res.status(200).json({
      message: `Payroll processed successfully for ${month}/${year}`,
      recordsCount: payrollRecords.length
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get payrolls list for a specific month/year
// @route   GET /api/payroll
// @access  Private
const getPayrolls = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    let query = {};

    if (req.user.role === 'Employee') {
      query.employee = req.user.employee._id;
    } else {
      if (employeeId) {
        query.employee = employeeId;
      }
    }

    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const payrolls = await Payroll.find(query).populate('employee').sort({ createdAt: -1 });
    return res.status(200).json(payrolls);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update payroll status to 'Paid' (and deduct the remaining advance salaries)
// @route   PUT /api/payroll/:id/pay
// @access  Private (Super Admin, HR Manager)
const payPayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate('employee');
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }

    if (payroll.status === 'Paid') {
      return res.status(400).json({ message: 'Payroll has already been paid' });
    }

    // 1. Process Advance Salary Deduction
    let deductionNeeded = payroll.advanceDeduction;
    if (deductionNeeded > 0) {
      const activeAdvances = await AdvanceSalary.find({
        employee: payroll.employee._id,
        remainingBalance: { $gt: 0 }
      }).sort({ date: 1 }); // oldest first

      for (const adv of activeAdvances) {
        if (deductionNeeded <= 0) break;

        if (adv.remainingBalance >= deductionNeeded) {
          adv.remainingBalance -= deductionNeeded;
          deductionNeeded = 0;
        } else {
          deductionNeeded -= adv.remainingBalance;
          adv.remainingBalance = 0;
        }
        await adv.save();
      }
    }

    // 2. Mark payroll as Paid
    payroll.status = 'Paid';
    payroll.paidAt = new Date();
    await payroll.save();

    // Populate employee details before returning
    await payroll.populate('employee');

    return res.status(200).json(payroll);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get detailed payslip for a payroll record
// @route   GET /api/payroll/:id
// @access  Private
const getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate('employee');
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }

    // Authorization checks
    if (req.user.role === 'Employee' && req.user.employee?._id.toString() !== payroll.employee._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view other payslips' });
    }

    return res.status(200).json(payroll);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generatePayroll,
  getPayrolls,
  payPayroll,
  getPayrollById
};
