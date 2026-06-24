const express = require('express');
const router = express.Router();
const { checkSetup, setupAdmin, login } = require('../controllers/authController');

router.get('/setup-check', checkSetup);
router.post('/setup-admin', setupAdmin);
router.post('/login', login);

module.exports = router;
