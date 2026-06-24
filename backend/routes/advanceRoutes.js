const express = require('express');
const router = express.Router();
const { requestAdvance, getAdvanceLogs, getRemainingBalance } = require('../controllers/advanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('Super Admin', 'HR Manager'), requestAdvance)
  .get(protect, getAdvanceLogs);

router.get('/balance/:employeeId', protect, getRemainingBalance);

module.exports = router;
