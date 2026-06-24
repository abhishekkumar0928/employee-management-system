const Employee = require('../models/Employee');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Overtime = require('../models/Overtime');
const AdvanceSalary = require('../models/AdvanceSalary');
const Payroll = require('../models/Payroll');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (Super Admin, HR Manager)
const getEmployees = async (req, res) => {
  try {
    const { status, department, search } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }
    if (department) {
      query.department = department;
    }
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await Employee.find(query).sort({ createdAt: -1 });
    
    // Fetch associated user accounts to include login info in response
    const employeesWithUser = await Promise.all(employees.map(async (emp) => {
      const user = await User.findOne({ employee: emp._id });
      return {
        ...emp.toObject(),
        username: user ? user.username : '',
        role: user ? user.role : 'Employee'
      };
    }));

    return res.status(200).json(employeesWithUser);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get single employee by ID
// @route   GET /api/employees/:id
// @access  Private (Self, Super Admin, HR Manager)
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check permissions
    if (req.user.role === 'Employee' && req.user.employee?._id.toString() !== employee._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view other employee details' });
    }

    const user = await User.findOne({ employee: employee._id });
    return res.status(200).json({
      ...employee.toObject(),
      username: user ? user.username : '',
      role: user ? user.role : 'Employee'
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (Super Admin, HR Manager)
const createEmployee = async (req, res) => {
  try {
    const {
      employeeId,
      fullName,
      gender,
      contactNumber,
      email,
      address,
      joiningDate,
      department,
      bankName,
      accountNumber,
      ifscCode,
      upiId,
      monthlySalary,
      overtimeRate,
      photo,
      username,
      password,
      role // HR Manager or Employee
    } = req.body;

    // Check duplicate employee ID
    const idExists = await Employee.findOne({ employeeId });
    if (idExists) {
      return res.status(400).json({ message: `Employee ID ${employeeId} is already in use` });
    }

    // Check duplicate email
    const emailExists = await Employee.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: `Email ${email} is already in use` });
    }

    // Check duplicate username if provided
    if (username) {
      const userExists = await User.findOne({ username });
      if (userExists) {
        return res.status(400).json({ message: `Username ${username} is already taken` });
      }
    }

    const employee = await Employee.create({
      employeeId,
      fullName,
      gender,
      contactNumber,
      email,
      address,
      joiningDate,
      department,
      bankName,
      accountNumber,
      ifscCode,
      upiId,
      monthlySalary,
      overtimeRate,
      photo,
      status: 'Active'
    });

    // Create user account if credentials are provided
    if (employee && username && password) {
      await User.create({
        username,
        password,
        role: role || 'Employee',
        employee: employee._id
      });
    }

    return res.status(201).json(employee);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (Super Admin, HR Manager)
const updateEmployee = async (req, res) => {
  try {
    const {
      fullName,
      gender,
      contactNumber,
      email,
      address,
      joiningDate,
      department,
      bankName,
      accountNumber,
      ifscCode,
      upiId,
      monthlySalary,
      overtimeRate,
      photo,
      status,
      username,
      password,
      role
    } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check duplicate email if it is changed
    if (email && email.toLowerCase() !== employee.email.toLowerCase()) {
      const emailExists = await Employee.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: `Email ${email} is already in use` });
      }
    }

    employee.fullName = fullName || employee.fullName;
    employee.gender = gender || employee.gender;
    employee.contactNumber = contactNumber || employee.contactNumber;
    employee.email = email || employee.email;
    employee.address = address || employee.address;
    employee.joiningDate = joiningDate || employee.joiningDate;
    employee.department = department || employee.department;
    employee.bankName = bankName || employee.bankName;
    employee.accountNumber = accountNumber || employee.accountNumber;
    employee.ifscCode = ifscCode || employee.ifscCode;
    employee.upiId = upiId !== undefined ? upiId : employee.upiId;
    employee.monthlySalary = monthlySalary !== undefined ? monthlySalary : employee.monthlySalary;
    employee.overtimeRate = overtimeRate !== undefined ? overtimeRate : employee.overtimeRate;
    employee.photo = photo !== undefined ? photo : employee.photo;
    employee.status = status || employee.status;

    const updatedEmployee = await employee.save();

    // Manage user credentials
    let user = await User.findOne({ employee: employee._id });
    if (user) {
      if (username) {
        // Check username duplication
        if (username !== user.username) {
          const userExists = await User.findOne({ username });
          if (userExists) {
            return res.status(400).json({ message: `Username ${username} is already taken` });
          }
          user.username = username;
        }
      }
      if (password) {
        user.password = password; // Trigger pre-save hashing
      }
      if (role) {
        user.role = role;
      }
      await user.save();
    } else if (username && password) {
      // Create user if not existing previously but now requested
      const userExists = await User.findOne({ username });
      if (userExists) {
        return res.status(400).json({ message: `Username ${username} is already taken` });
      }
      await User.create({
        username,
        password,
        role: role || 'Employee',
        employee: employee._id
      });
    }

    return res.status(200).json(updatedEmployee);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private (Super Admin, HR Manager)
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Cascade delete associated documents
    await User.deleteMany({ employee: employee._id });
    await Attendance.deleteMany({ employee: employee._id });
    await Leave.deleteMany({ employee: employee._id });
    await Overtime.deleteMany({ employee: employee._id });
    await AdvanceSalary.deleteMany({ employee: employee._id });
    await Payroll.deleteMany({ employee: employee._id });
    await Employee.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: 'Employee and all associated records deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
