const express = require('express');
const {
  requestOtp,
  verifyOtp,
  checkEmail,
  createPassword,
  googleAuth,
  adminLogin,
  logout,
  getUserProfile,
  logoutAll,
  revokeSession,
  refreshToken,
  updateLocation,
  requestAccountDeletionOtp,
  deleteAccount
} = require('../controllers/authController');

const {
  requestLoginOtp: phoneRequestLoginOtp,
  verifyLoginOtp: phoneVerifyLoginOtp,
  sendVerifyOtp: phoneSendVerifyOtp,
  confirmVerifyOtp: phoneConfirmVerifyOtp,
} = require('../controllers/phoneAuthController');

const { isAuthenticatedUser } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const authValidator = require('../validators/authValidator');
const phoneAuthValidator = require('../validators/phoneAuthValidator');
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

// Loose limiter for the checkout silent-email-check — fires on every Contact
// Information step, so it needs more headroom than the OTP limiters, but
// still bounded to blunt email-enumeration scraping.
const checkEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// ── Passwordless sign-in (unified login + signup via email OTP) ──
// request-otp: send a 6-digit code to the email (works for new & returning).
// verify-otp:  validate the code → sign in the existing user OR auto-create a
//              passwordless account, then issue the JWT session cookie.
router.post('/request-otp', otpLimiter, validate(authValidator.requestOtp), requestOtp);
router.post('/verify-otp', loginLimiter, validate(authValidator.verifyOtp), verifyOtp);

// ── Guest checkout support ──
// check-email: silent lookup powering the checkout Contact Information step's
// Welcome Back/Sign In vs Continue-as-guest branch.
// create-password: guest → registered conversion, gated by the same OTP
// challenge /request-otp sends (no new send-code path needed).
router.post('/check-email', checkEmailLimiter, validate(authValidator.checkEmail), checkEmail);
router.post('/create-password', loginLimiter, validate(authValidator.createPassword), createPassword);

// ── Phone OTP (MSG91) ──
// login/request-otp + login/verify-otp: passwordless sign-in for existing
//   accounts by mobile number (verify-otp issues the JWT session cookie).
// send-otp + verify: generic ownership proof used by registration, guest
//   checkout and profile phone-change — verify returns a short-lived token.
router.post('/phone/login/request-otp', otpLimiter, validate(phoneAuthValidator.loginRequest), phoneRequestLoginOtp);
router.post('/phone/login/verify-otp', loginLimiter, validate(phoneAuthValidator.loginVerify), phoneVerifyLoginOtp);
router.post('/phone/send-otp', otpLimiter, validate(phoneAuthValidator.sendOtp), phoneSendVerifyOtp);
router.post('/phone/verify', loginLimiter, validate(phoneAuthValidator.verify), phoneConfirmVerifyOtp);

// Google sign-in — body is just { idToken }; the service verifies it via
// Firebase Admin, so no Zod validator here.
router.post('/google', loginLimiter, googleAuth);
// Admin keeps a password — a separate, privileged surface.
router.post('/admin-login', loginLimiter, validate(authValidator.login), adminLogin);
router.post('/refresh', refreshToken);

router.get('/logout', isAuthenticatedUser, logout);
router.get('/logout-all', isAuthenticatedUser, logoutAll);
router.get('/me', isAuthenticatedUser, getUserProfile);
router.post('/location', isAuthenticatedUser, updateLocation);

// ── Self-service account deletion (soft delete + anonymize, OTP-gated) ──
// request-otp: email a 6-digit confirmation code to the account's own address.
// delete-account: verify the code, then anonymize + wipe sessions (keeps orders).
router.post('/delete-account/request-otp', isAuthenticatedUser, otpLimiter, requestAccountDeletionOtp);
router.post('/delete-account', isAuthenticatedUser, loginLimiter, validate(authValidator.deleteAccount), deleteAccount);

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
