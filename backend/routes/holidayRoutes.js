const express = require('express');
const router = express.Router();
const { getHolidays, addHoliday, deleteHoliday } = require('../controllers/holidayController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getHolidays)
  .post(protect, authorize('Super Admin', 'HR Manager'), addHoliday);

router.delete('/:id', protect, authorize('Super Admin', 'HR Manager'), deleteHoliday);

module.exports = router;
