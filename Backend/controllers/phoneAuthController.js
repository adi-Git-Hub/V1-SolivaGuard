const phoneOtpService = require('../services/phoneOtpService');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const { setAuthCookies } = require('../utils/authUtils');
const sendResponse = require('../utils/sendResponse');

// @desc    Phone sign-in — step 1: send a code to an existing account's number
// @route   POST /api/v1/auth/phone/login/request-otp
// @access  Public
exports.requestLoginOtp = catchAsyncErrors(async (req, res, next) => {
  const result = await phoneOtpService.requestLoginOtp(req.body.phone, req);
  return sendResponse(res, {
    message: `We've sent a sign-in code to your mobile ending ${result.phone}`,
    data: { phone: result.phone },
  });
});

// @desc    Phone sign-in — step 2: verify the code → issue the session cookie
// @route   POST /api/v1/auth/phone/login/verify-otp
// @access  Public
exports.verifyLoginOtp = catchAsyncErrors(async (req, res, next) => {
  const { phone, otp } = req.body;
  const { user, accessToken, refreshToken } = await phoneOtpService.verifyLoginOtp(phone, otp, req);

  setAuthCookies(res, accessToken, refreshToken);
  return sendResponse(res, {
    data: { user },
    message: 'Signed in successfully',
  });
});

// @desc    Send an ownership-verification code (registration / checkout / profile)
// @route   POST /api/v1/auth/phone/send-otp
// @access  Public (rate-limited)
exports.sendVerifyOtp = catchAsyncErrors(async (req, res, next) => {
  const { phone, purpose } = req.body;
  const result = await phoneOtpService.sendOtp(phone, purpose || 'verify', req);
  return sendResponse(res, {
    message: `We've sent a verification code to your mobile ending ${result.phone}`,
    data: { phone: result.phone },
  });
});

// @desc    Verify an ownership code → return a short-lived proof token
// @route   POST /api/v1/auth/phone/verify
// @access  Public
exports.confirmVerifyOtp = catchAsyncErrors(async (req, res, next) => {
  const { phone, otp, purpose } = req.body;
  const result = await phoneOtpService.verifyForToken(phone, otp, purpose || 'verify', req);
  return sendResponse(res, {
    message: 'Mobile number verified',
    data: { phone: result.phone, phoneVerifyToken: result.phoneVerifyToken },
  });
});
