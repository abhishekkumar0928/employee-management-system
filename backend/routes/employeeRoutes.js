const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, authorize('Super Admin', 'HR Manager'), getEmployees)
  .post(protect, authorize('Super Admin', 'HR Manager'), createEmployee);

router.route('/:id')
  .get(protect, getEmployeeById)
  .put(protect, authorize('Super Admin', 'HR Manager'), updateEmployee)
  .delete(protect, authorize('Super Admin', 'HR Manager'), deleteEmployee);

module.exports = router;
