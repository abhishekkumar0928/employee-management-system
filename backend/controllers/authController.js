const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_employee_management_jwt_key_2026', {
    expiresIn: '30d',
  });
};

// @desc    Check if setup is required (no users exist)
// @route   GET /api/auth/setup-check
// @access  Public
const checkSetup = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    return res.status(200).json({ setupRequired: userCount === 0 });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Setup the first Administrator account
// @route   POST /api/auth/setup-admin
// @access  Public
const setupAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide both username and password' });
    }

    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return res.status(400).json({ message: 'Setup has already been completed. Admin accounts cannot be set up this way anymore.' });
    }

    const user = await User.create({
      username,
      password,
      role: 'Super Admin'
    });

    if (user) {
      return res.status(201).json({
        _id: user._id,
        username: user.username,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      return res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    const user = await User.findOne({ username }).populate('employee');

    if (user && (await user.matchPassword(password))) {
      return res.status(200).json({
        _id: user._id,
        username: user.username,
        role: user.role,
        employee: user.employee,
        token: generateToken(user._id)
      });
    } else {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  checkSetup,
  setupAdmin,
  login
};
