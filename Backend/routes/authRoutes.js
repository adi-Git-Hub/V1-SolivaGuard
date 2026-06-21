const express = require('express');
const {
  registerUser,
  loginUser,
  googleAuth,
  adminLogin,
  logout,
  forgotPassword,
  resetPassword,
  getUserProfile,
  verifyEmail,
  resendOTP,
  verifyForgotOTP,
  logoutAll,
  revokeSession,
  refreshToken,
  updateLocation
} = require('../controllers/authController');

const { isAuthenticatedUser } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const authValidator = require('../validators/authValidator');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Route-specific rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many OTP requests, please try again later.' }
});

router.post('/register', validate(authValidator.register), registerUser);
router.post('/verify-email', validate(authValidator.verifyEmail), verifyEmail);
router.post('/resend-otp', otpLimiter, validate(authValidator.forgotPassword), resendOTP); // Using same validator (needs email)

router.post('/login', loginLimiter, validate(authValidator.login), loginUser);
// Google sign-in — body is just { idToken }; the service verifies it via
// Firebase Admin, so no Zod validator here.
router.post('/google', loginLimiter, googleAuth);
router.post('/admin-login', loginLimiter, validate(authValidator.login), adminLogin);
router.post('/refresh', refreshToken);

router.post('/forgot-password', otpLimiter, validate(authValidator.forgotPassword), forgotPassword);
router.post('/verify-forgot-otp', validate(authValidator.verifyEmail), verifyForgotOTP); // Reusing schema
router.post('/reset-password', validate(authValidator.resetPassword), resetPassword);

router.get('/logout', isAuthenticatedUser, logout);
router.get('/logout-all', isAuthenticatedUser, logoutAll);
router.get('/me', isAuthenticatedUser, getUserProfile);
router.post('/location', isAuthenticatedUser, updateLocation);

router.get('/sessions', isAuthenticatedUser, async (req, res) => {
  const user = await require('../models/userModel').findById(req.user.id).select('+sessions');
  res.json({
    success: true,
    data: {
      sessions: user.sessions.map(s => ({
        sessionId: s.sessionId,
        ip: s.ipHash,
        device: s.device,
        browser: s.browser,
        lastActive: s.lastActive,
        isCurrent: s.sessionId === req.sessionId
      }))
    }
  });
});
router.delete('/sessions/:sessionId', isAuthenticatedUser, revokeSession);
router.delete('/sessions', isAuthenticatedUser, require('../controllers/authController').revokeOtherSessions);

module.exports = router;
