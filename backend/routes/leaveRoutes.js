const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getLeaves,
  updateLeaveStatus,
  getLeaveBalances
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('Employee'), applyLeave)
  .get(protect, getLeaves);

router.put('/:id/status', protect, authorize('Super Admin', 'HR Manager'), updateLeaveStatus);
router.get('/balances/:employeeId', protect, getLeaveBalances);

module.exports = router;
