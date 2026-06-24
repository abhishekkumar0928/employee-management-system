const express = require('express');
const router = express.Router();
const { generatePayroll, getPayrolls, payPayroll, getPayrollById } = require('../controllers/payrollController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/generate', protect, authorize('Super Admin', 'HR Manager'), generatePayroll);
router.get('/', protect, getPayrolls);
router.put('/:id/pay', protect, authorize('Super Admin', 'HR Manager'), payPayroll);
router.get('/:id', protect, getPayrollById);

module.exports = router;
