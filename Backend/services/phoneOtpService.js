const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const authRepository = require('../repositories/authRepository');
const authService = require('./authService'); // reuse session + login-context helpers
const geo = require('./geoService');
const ErrorHandler = require('../utils/errorHandler');
const { makeOTP, hashOtp, otpExpiryDate, hashIP } = require('../utils/otp');
const { normalizePhone, maskPhone, phoneLookupVariants } = require('../utils/phone');
const smsService = require('./smsService');
const { generateAccessToken, generateRefreshToken } = require('../utils/authUtils');

// Soft resend cooldown — a stuck retry loop can't SMS-bomb a number.
const RESEND_COOLDOWN_MS = 20 * 1000;
const MAX_ATTEMPTS = 5;
// Proof-of-ownership token lifetime (register / checkout / profile phone change).
const VERIFY_TOKEN_TTL = '15m';

// ── Reusable Phone OTP subsystem ─────────────────────────────────────────────
// One place owns generation, expiry, attempts, cooldown, rate-limit-friendly
// upserts and MSG91 dispatch. Every flow (login, registration, checkout,
// profile) calls into here so the rules are identical everywhere.
class PhoneOtpService {
  /** Whether the SMS provider is live (real creds or mock mode). */
  isEnabled() {
    return smsService.isConfigured();
  }

  /**
   * Generate + store + send an OTP for a phone. Honors the resend cooldown.
   * @returns {{ phone: string, cooldown?: boolean }} masked phone only.
   */
  async sendOtp(rawPhone, purpose, req) {
    if (!this.isEnabled()) {
      throw new ErrorHandler(
        'Phone verification is unavailable right now. Please use email instead.',
        503,
        'PHONE_OTP_DISABLED'
      );
    }
    const { national } = normalizePhone(rawPhone);

    const existing = await authRepository.findPhoneOtp(national);
    if (
      existing &&
      existing.lastSentAt &&
      Date.now() - new Date(existing.lastSentAt).getTime() < RESEND_COOLDOWN_MS
    ) {
      // Respond as success without resending (no timing signal).
      return { phone: maskPhone(national), cooldown: true };
    }

    const { otp, hashedOTP } = makeOTP();
    await authRepository.upsertPhoneOtp(national, {
      otpHash: hashedOTP,
      purpose: purpose || 'verify',
      expiresAt: otpExpiryDate(),
      attempts: 0,
      lastSentAt: new Date(),
    });

    await smsService.sendOtpSms(national, otp);

    await authRepository.createAuditLog({
      action: 'phone_otp_sent',
      status: 'success',
      ipHash: hashIP(req && req.ip),
      device: req && req.headers && req.headers['user-agent'],
      message: `phone_${purpose || 'verify'}`,
    });

    return { phone: maskPhone(national) };
  }

  /**
   * Validate a code against the stored challenge and BURN it on success.
   * @returns {Promise<string>} the canonical national number.
   */
  async consumeOtp(rawPhone, otp, req) {
    const { national } = normalizePhone(rawPhone);
    const challenge = await authRepository.findPhoneOtp(national);

    if (!challenge || challenge.expiresAt < new Date()) {
      throw new ErrorHandler('Invalid or expired code. Please request a new one.', 400);
    }
    if (challenge.attempts >= MAX_ATTEMPTS) {
      await authRepository.deletePhoneOtp(national);
      throw new ErrorHandler('Too many incorrect attempts. Please request a new code.', 429);
    }
    if (challenge.otpHash !== hashOtp(otp)) {
      await authRepository.incrementPhoneOtpAttempts(national);
      await authRepository.createAuditLog({
        action: 'phone_otp_failed',
        status: 'failure',
        ipHash: hashIP(req && req.ip),
      });
      throw new ErrorHandler('Invalid or expired code. Please try again.', 400);
    }

    await authRepository.deletePhoneOtp(national);
    return national;
  }

  /**
   * Verify a code and return a signed proof token. Used by registration,
   * guest checkout and profile phone-change to prove ownership to a later
   * write without keeping server state.
   */
  async verifyForToken(rawPhone, otp, purpose, req) {
    const national = await this.consumeOtp(rawPhone, otp, req);
    const phoneVerifyToken = jwt.sign(
      { phone: national, purpose: purpose || 'verify', kind: 'phone_verify' },
      process.env.JWT_SECRET,
      { expiresIn: VERIFY_TOKEN_TTL }
    );
    await authRepository.createAuditLog({
      action: 'phone_verified',
      status: 'success',
      ipHash: hashIP(req && req.ip),
      message: `phone_${purpose || 'verify'}`,
    });
    return { phone: maskPhone(national), phoneVerifyToken };
  }

  /**
   * Validate a proof token and confirm it matches the submitted phone.
   * @returns {string} the canonical national number.
   */
  verifyToken(token, rawPhone) {
    if (!token) {
      throw new ErrorHandler('Please verify your mobile number first.', 400, 'PHONE_VERIFY_REQUIRED');
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw new ErrorHandler(
        'Phone verification expired. Please verify your number again.',
        400,
        'PHONE_VERIFY_EXPIRED'
      );
    }
    const { national } = normalizePhone(rawPhone);
    if (decoded.kind !== 'phone_verify' || decoded.phone !== national) {
      throw new ErrorHandler(
        'Phone verification does not match. Please verify your number again.',
        400,
        'PHONE_VERIFY_MISMATCH'
      );
    }
    return national;
  }

  // ── Phone LOGIN (existing accounts only) ──────────────────────────────────

  /** Step 1: send a sign-in code to a number that already has an account. */
  async requestLoginOtp(rawPhone, req) {
    if (!this.isEnabled()) {
      throw new ErrorHandler(
        'Phone sign-in is unavailable right now. Please use email instead.',
        503,
        'PHONE_OTP_DISABLED'
      );
    }
    const { national } = normalizePhone(rawPhone);
    const user = await authRepository.findUserByPhoneVariants(phoneLookupVariants(national));

    if (!user || user.status === 'deleted') {
      throw new ErrorHandler(
        'No account is registered with this mobile number. Please sign in with email.',
        404,
        'PHONE_NOT_FOUND'
      );
    }
    if (user.status === 'blocked') {
      throw new ErrorHandler('Your account has been restricted. Please contact the admin.', 403, 'ACCOUNT_BLOCKED');
    }

    return this.sendOtp(national, 'login', req);
  }

  /** Step 2: verify the code and sign the existing user in (issues a session). */
  async verifyLoginOtp(rawPhone, otp, req) {
    const { national } = normalizePhone(rawPhone);

    // Resolve the user BEFORE burning the code, so a valid code for a
    // since-deleted account doesn't consume the challenge silently.
    const user = await authRepository.findUserByPhoneVariants(phoneLookupVariants(national));
    if (!user || user.status === 'deleted') {
      throw new ErrorHandler('No account is registered with this mobile number.', 404, 'PHONE_NOT_FOUND');
    }
    if (user.status === 'blocked') {
      throw new ErrorHandler('Your account has been restricted. Please contact the admin.', 403, 'ACCOUNT_BLOCKED');
    }
    if (user.isLocked) {
      throw new ErrorHandler('Account is temporarily locked', 403);
    }

    await this.consumeOtp(national, otp, req);

    if (!user.isVerified) {
      user.isVerified = true;
      user.verifiedAt = new Date();
    }
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    const sessionId = crypto.randomBytes(16).toString('hex');
    user.sessions.push(authService.generateSession(req, sessionId));
    authService.applyLoginContext(user, req);
    await authRepository.saveUser(user);
    authService.geolocateLoginAsync(user._id, geo.getClientIp(req));

    await authRepository.createAuditLog({
      userId: user._id,
      action: 'login_success',
      status: 'success',
      ipHash: hashIP(req && req.ip),
      message: 'phone_otp',
    });

    const accessToken = generateAccessToken(user._id, sessionId);
    const refreshToken = generateRefreshToken(user._id, sessionId);
    return { user, accessToken, refreshToken };
  }
}

module.exports = new PhoneOtpService();
