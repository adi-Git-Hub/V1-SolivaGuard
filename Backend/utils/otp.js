const crypto = require('crypto');

// Shared OTP helpers — mirror the private ones in authService so the phone-OTP
// subsystem uses identical generation, hashing, expiry and IP-hashing rules.

function makeOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
  return { otp, hashedOTP };
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function otpExpiryDate() {
  const minutes = parseInt(process.env.OTP_EXPIRE, 10) || 10;
  return new Date(Date.now() + minutes * 60 * 1000);
}

function hashIP(ip) {
  return crypto.createHash('sha256').update(ip || '').digest('hex');
}

module.exports = { makeOTP, hashOtp, otpExpiryDate, hashIP };
