const express = require('express');
const { getSystemHealth, getPublicConfig } = require('../controllers/systemController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Public runtime feature flags (e.g. phoneOtpEnabled) — safe for guests.
router.get('/config', getPublicConfig);

router.get('/health', isAuthenticatedUser, authorizeRoles('admin'), getSystemHealth);

module.exports = router;