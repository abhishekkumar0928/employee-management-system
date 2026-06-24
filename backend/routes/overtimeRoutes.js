const express = require('express');
const router = express.Router();
const { logOvertime, getOvertime, updateOvertimeStatus } = require('../controllers/overtimeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, logOvertime)
  .get(protect, getOvertime);

router.put('/:id/status', protect, authorize('Super Admin', 'HR Manager'), updateOvertimeStatus);

module.exports = router;
