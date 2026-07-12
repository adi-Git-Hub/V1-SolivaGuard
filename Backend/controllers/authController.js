const authService = require('../services/authService');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const { setAuthCookies, clearAuthCookies } = require('../utils/authUtils');
const sendResponse = require('../utils/sendResponse');

// @desc    Register a user
// @route   POST /api/v1/auth/register
// @access  Public
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const result = await authService.register(req.body, req);
  
  return sendResponse(res, {
    statusCode: 201,
    message: `OTP sent to email: ${result.email}`,
  });
});

// @desc    Verify Email OTP
// @route   POST /api/v1/auth/verify-email
// @access  Public
exports.verifyEmail = catchAsyncErrors(async (req, res, next) => {
  const { email, otp } = req.body;
  const { user, accessToken, refreshToken } = await authService.verifyEmail(email, otp, req);
  
  setAuthCookies(res, accessToken, refreshToken);
  
  return sendResponse(res, {
    data: { user },
    message: 'Email verified successfully',
  });
});

// @desc    Resend Verification OTP
// @route   POST /api/v1/auth/resend-otp
// @access  Public
exports.resendOTP = catchAsyncErrors(async (req, res, next) => {
  const result = await authService.resendVerificationOTP(req.body.email);
  
  return sendResponse(res, {
    message: `OTP resent to email: ${result.email}`,
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login(email, password, req);
  
  setAuthCookies(res, accessToken, refreshToken);
  
  return sendResponse(res, {
    data: { user },
  });
});

// @desc    Request a passwordless sign-in code (login OR signup, unified)
// @route   POST /api/v1/auth/request-otp
// @access  Public
exports.requestOtp = catchAsyncErrors(async (req, res, next) => {
  const result = await authService.requestLoginOtp(req.body.email, req);

  // Same response whether or not the account exists (no account enumeration).
  return sendResponse(res, {
    message: `We've sent a sign-in code to ${result.email}`,
  });
});

// @desc    Verify the sign-in code → log in existing user or create + log in
// @route   POST /api/v1/auth/verify-otp
// @access  Public
exports.verifyOtp = catchAsyncErrors(async (req, res, next) => {
  const { email, otp } = req.body;
  const { user, accessToken, refreshToken } = await authService.verifyLoginOtp(email, otp, req);

  setAuthCookies(res, accessToken, refreshToken);

  return sendResponse(res, {
    data: { user },
    message: 'Signed in successfully',
  });
});

// @desc    Silently check whether an email already has an account (checkout's
//          Contact Information step — branches to Welcome Back/Sign In vs
//          Continue as guest)
// @route   POST /api/v1/auth/check-email
// @access  Public
exports.checkEmail = catchAsyncErrors(async (req, res, next) => {
  const result = await authService.checkEmailExists(req.body.email);

  return sendResponse(res, {
    data: result,
  });
});

// @desc    Set a password on a passwordless account (guest checkout or
//          OTP/Google signup) — converts it to a fully registered account.
//          Gated by the same email-OTP challenge /request-otp sends.
// @route   POST /api/v1/auth/create-password
// @access  Public (OTP-gated)
exports.createPassword = catchAsyncErrors(async (req, res, next) => {
  const { email, otp, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.createPassword(email, otp, password, req);

  setAuthCookies(res, accessToken, refreshToken);

  return sendResponse(res, {
    data: { user },
    message: 'Password created successfully',
  });
});

// @desc    Sign in / sign up with Google (Firebase ID token)
// @route   POST /api/v1/auth/google
// @access  Public
exports.googleAuth = catchAsyncErrors(async (req, res, next) => {
  const { idToken } = req.body;
  const { user, accessToken, refreshToken } = await authService.googleAuth(idToken, req);

  setAuthCookies(res, accessToken, refreshToken);

  return sendResponse(res, {
    data: { user },
    message: 'Signed in with Google',
  });
});

// @desc    Admin Login
// @route   POST /api/v1/auth/admin-login
// @access  Public
exports.adminLogin = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login(email, password, req, true);
  
  setAuthCookies(res, accessToken, refreshToken);
  
  return sendResponse(res, {
    data: { user },
  });
});

// @desc    Refresh Token
// @route   POST /api/v1/auth/refresh
// @access  Public (via refresh token cookie)
exports.refreshToken = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return sendResponse(res, { statusCode: 401, message: 'Refresh token not found' });
  }

  const { user, accessToken, refreshToken } = await authService.refreshToken(token, req);
  
  setAuthCookies(res, accessToken, refreshToken);
  
  return sendResponse(res, {
    data: { user },
  });
});

// @desc    Forgot Password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const result = await authService.forgotPassword(req.body.email);
  
  return sendResponse(res, {
    message: `Recovery OTP sent to email: ${result.email}`,
  });
});

// @desc    Verify Forgot Password OTP
// @route   POST /api/v1/auth/verify-forgot-otp
// @access  Public
exports.verifyForgotOTP = catchAsyncErrors(async (req, res, next) => {
  const { email, otp } = req.body;
  await authService.verifyForgotOTP(email, otp);
  
  return sendResponse(res, {
    message: 'OTP verified, you can now reset your password',
  });
});

// @desc    Reset Password
// @route   POST /api/v1/auth/reset-password
// @access  Public
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { email, otp, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.resetPassword(email, otp, password, req);
  
  setAuthCookies(res, accessToken, refreshToken);
  
  return sendResponse(res, {
    data: { user },
    message: 'Password reset successfully',
  });
});

// @desc    Logout user (current device)
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = catchAsyncErrors(async (req, res, next) => {
  await authService.logout(req.user.id, req.sessionId);
  clearAuthCookies(res);
  
  return sendResponse(res, {
    message: 'Logged out successfully',
  });
});

// @desc    Logout all devices
// @route   GET /api/v1/auth/logout-all
// @access  Private
exports.logoutAll = catchAsyncErrors(async (req, res, next) => {
  await authService.logoutAll(req.user.id);
  clearAuthCookies(res);
  
  return sendResponse(res, {
    message: 'Logged out from all devices successfully',
  });
});

// @desc    Request an email OTP to confirm account deletion
// @route   POST /api/v1/auth/delete-account/request-otp
// @access  Private
exports.requestAccountDeletionOtp = catchAsyncErrors(async (req, res, next) => {
  const result = await authService.requestAccountDeletionOtp(req.user.id, req);

  return sendResponse(res, {
    message: `We've sent a confirmation code to ${result.email}`,
  });
});

// @desc    Permanently delete (soft-delete + anonymize) the logged-in account
// @route   POST /api/v1/auth/delete-account
// @access  Private (OTP-gated)
exports.deleteAccount = catchAsyncErrors(async (req, res, next) => {
  await authService.deleteAccount(req.user.id, req.body.otp, req);
  clearAuthCookies(res);

  return sendResponse(res, {
    message: 'Your account has been deleted.',
  });
});

// @desc    Revoke specific session
// @route   DELETE /api/v1/auth/sessions/:sessionId
// @access  Private
exports.revokeSession = catchAsyncErrors(async (req, res, next) => {
  await authService.revokeSession(req.user.id, req.params.sessionId);
  
  return sendResponse(res, {
    message: 'Session revoked successfully',
  });
});

// @desc    Revoke all other sessions
// @route   DELETE /api/v1/auth/sessions
// @access  Private
exports.revokeOtherSessions = catchAsyncErrors(async (req, res, next) => {
  await authService.revokeOtherSessions(req.user.id, req.sessionId);
  
  return sendResponse(res, {
    message: 'All other sessions revoked successfully',
  });
});

// @desc    Store precise GPS location for the logged-in user (opt-in)
// @route   POST /api/v1/auth/location
// @access  Private
exports.updateLocation = catchAsyncErrors(async (req, res, next) => {
  const { latitude, longitude } = req.body;
  const result = await authService.updateGpsLocation(req.user.id, latitude, longitude);
  return sendResponse(res, {
    message: 'Location updated',
    data: { area: result.areaName || null, city: result.lastLoginCity || null },
  });
});

// @desc    Get currently logged in user details
// @route   GET /api/v1/auth/me
// @access  Private
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
  // Login telemetry (IP, precise GPS, ISP) is admin-only — never return it to
  // the account holder via /auth/me.
  const user = await require('../models/userModel')
    .findById(req.user.id)
    .select('-lastLoginIP -lastLatitude -lastLongitude -lastLoginISP -lastLoginCity -lastLoginState -lastLoginCountry -areaName -subLocality -locality -deviceInfo -browserInfo -osInfo');
  return sendResponse(res, {
    data: { 
      user,
      permissions: user.role === 'admin' ? ['all'] : ['read'],
      verificationStatus: user.isVerified 
    },
  });
});
