const express = require('express');
const { getSystemHealth } = require('../controllers/systemController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/health', isAuthenticatedUser, authorizeRoles('admin'), getSystemHealth);

module.exports = router;