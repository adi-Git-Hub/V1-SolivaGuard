const express = require('express');
const rateLimit = require('express-rate-limit');
const { trackEvent } = require('../controllers/analyticsController');
const { attachUserIfPresent } = require('../middleware/authMiddleware');

const router = express.Router();

// Specific rate limiter for analytics ingestion (120 events per minute per IP)
const trackLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  message: { success: false, message: 'Too many analytics events from this IP' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Ingest page view event
// attachUserIfPresent extracts authenticated session if present without rejecting guests
router.post('/track', trackLimiter, attachUserIfPresent, trackEvent);

module.exports = router;
