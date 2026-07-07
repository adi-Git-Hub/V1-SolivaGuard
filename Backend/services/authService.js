const authRepository = require('../repositories/authRepository');
const ErrorHandler = require('../utils/errorHandler');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const { getOTPTemplate, getWelcomeTemplate, getPasswordChangedTemplate } = require('../utils/emailTemplates');
const { enqueueEmail } = require('../queues/emailQueue');
const { generateAccessToken, generateRefreshToken } = require('../utils/authUtils');
const firebaseAdmin = require('../config/firebaseAdmin');
const geo = require('./geoService');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

function makeOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
  return { otp, hashedOTP };
}

function otpExpiryDate() {
  const minutes = parseInt(process.env.OTP_EXPIRE, 10) || 10;
  return new Date(Date.now() + minutes * 60 * 1000);
}

function hashIP(ip) {
  return crypto.createHash('sha256').update(ip || '').digest('hex');
}

class AuthService {
  async register(data, req) {
    const { name, email, password, username, phoneNumber } = data;
    const normalizedEmail = String(email).toLowerCase();
    // Treat an empty / whitespace phone as "not provided" so it never lands in
    // the sparse unique index (many users legitimately have no phone).
    const normalizedPhone =
      phoneNumber && String(phoneNumber).trim() ? String(phoneNumber).trim() : undefined;

    // ── Duplicate checks UP FRONT (at registration), so the user sees a clear
    // message here instead of a cryptic E11000 AFTER entering the OTP. ──
    const emailExists = await authRepository.findUserByEmail(normalizedEmail);
    if (emailExists) {
      // This email already belongs to a Google (passwordless) account. Tell the
      // user to sign in with Google instead of showing a generic "already exists"
      // message — they have no password to set/enter here.
      if (emailExists.authProvider === 'google' || emailExists.googleId) {
        throw new ErrorHandler('This email is already registered with Google sign-in. Please use "Continue with Google" to log in.', 400);
      }
      throw new ErrorHandler('An account with this email already exists', 400);
    }

    if (normalizedPhone) {
      const phoneExists = await authRepository.findUserByPhone(normalizedPhone);
      if (phoneExists) throw new ErrorHandler('This phone number is already registered', 400);
    }

    // Username is auto-derived from the email local-part unless the user gave one.
    let finalUsername = (username || normalizedEmail.split('@')[0]).toLowerCase();
    if (username) {
      // Explicit username → report a duplicate rather than silently changing it.
      const usernameTaken = await authRepository.findUserByUsername(finalUsername);
      if (usernameTaken) throw new ErrorHandler('This username is already taken', 400);
    } else {
      // Auto-derived → guarantee uniqueness without blocking a valid signup
      // (e.g. john@gmail.com and john@yahoo.com both derive "john").
      const base = finalUsername;
      while (await authRepository.findUserByUsername(finalUsername)) {
        finalUsername = `${base}${crypto.randomBytes(2).toString('hex')}`;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const { otp, hashedOTP } = makeOTP();

    await authRepository.updatePendingRegistration(normalizedEmail, {
      name,
      username: finalUsername,
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      passwordHash,
      emailOTP: hashedOTP,
      otpExpire: otpExpiryDate(),
      retryCount: 0,
    });

    await authRepository.createAuditLog({
      email: normalizedEmail,
      action: 'registration_initiated',
      status: 'success',
      ipHash: hashIP(req.ip),
      device: req.headers['user-agent'],
    });



    const html = getOTPTemplate(otp, 'verification');
    await enqueueEmail('registrationOTP', {
      email: normalizedEmail,
      subject: 'Soliva - Email Verification',
      html,
    });

    return { email: normalizedEmail };
  }

  async resendVerificationOTP(email) {
    const normalizedEmail = String(email).toLowerCase();

    const pending = await authRepository.findPendingRegistration(normalizedEmail);
    if (!pending) {
      throw new ErrorHandler('No pending registration found for this email. Please register again.', 400);
    }

    const { otp, hashedOTP } = makeOTP();

    await authRepository.updatePendingRegistration(normalizedEmail, {
      emailOTP: hashedOTP,
      otpExpire: otpExpiryDate(),
    });



    const html = getOTPTemplate(otp, 'verification');
    await enqueueEmail('registrationOTP', {
      email: normalizedEmail,
      subject: 'Soliva - Email Verification',
      html,
    });

    return { email: normalizedEmail };
  }

  async verifyEmail(email, otp, req) {
    const normalizedEmail = String(email).toLowerCase();
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    const pending = await authRepository.findPendingRegistration(normalizedEmail);
    if (!pending || pending.emailOTP !== hashedOTP || pending.otpExpire < new Date()) {
      await authRepository.createAuditLog({
        email: normalizedEmail,
        action: 'otp_failed',
        status: 'failure',
        ipHash: hashIP(req.ip),
        message: 'Invalid or expired registration OTP',
      });
      throw new ErrorHandler('Invalid or expired OTP', 400);
    }

    const sessionId = crypto.randomBytes(16).toString('hex');
    const newSession = this.generateSession(req, sessionId);

    const userData = {
      name: pending.name,
      username: pending.username,
      email: pending.email,
      password: pending.passwordHash,
      isVerified: true,
      verifiedAt: new Date(),
      sessions: [newSession],
    };
    // Only attach phoneNumber when one was actually provided — never write null,
    // which would collide with other phoneless users on the sparse unique index.
    if (pending.phoneNumber) userData.phoneNumber = pending.phoneNumber;
    this.applyLoginContext(userData, req);

    const user = await authRepository.createUser(userData);
    this.geolocateLoginAsync(user._id, geo.getClientIp(req));

    await authRepository.deletePendingRegistration(normalizedEmail);
    
    await authRepository.createAuditLog({
      userId: user._id,
      action: 'email_verified',
      status: 'success',
      ipHash: hashIP(req.ip),
    });

    const accessToken = generateAccessToken(user._id, sessionId);
    const refreshToken = generateRefreshToken(user._id, sessionId);

    const html = getWelcomeTemplate(user.name);
    await enqueueEmail('welcomeEmail', {
      email: user.email,
      subject: 'Welcome to Soliva!',
      html,
    });

    return { user, sessionId, accessToken, refreshToken };
  }

  async forgotPassword(email) {
    const normalizedEmail = String(email).toLowerCase();

    const user = await authRepository.findUserByEmail(normalizedEmail);
    if (!user) {
      throw new ErrorHandler('No account found with this email', 404);
    }

    const { otp, hashedOTP } = makeOTP();
    user.forgotPasswordOTP = hashedOTP;
    user.forgotPasswordExpire = otpExpiryDate();
    await authRepository.saveUser(user);

    await authRepository.createAuditLog({
      userId: user._id,
      email: normalizedEmail,
      action: 'password_reset_initiated',
      status: 'success',
    });



    const html = getOTPTemplate(otp, 'forgotPassword');
    await enqueueEmail('forgotPasswordOTP', {
      email: normalizedEmail,
      subject: 'Soliva - Reset Your Password',
      html,
    });

    return { email: normalizedEmail };
  }

  async verifyForgotOTP(email, otp) {
    const normalizedEmail = String(email).toLowerCase();
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await authRepository.findUserByEmail(normalizedEmail);
    if (
      !user ||
      user.forgotPasswordOTP !== hashedOTP ||
      !user.forgotPasswordExpire ||
      user.forgotPasswordExpire < new Date()
    ) {
      throw new ErrorHandler('Invalid or expired OTP', 400);
    }

    return { email: normalizedEmail };
  }

  async resetPassword(email, otp, password, req) {
    const normalizedEmail = String(email).toLowerCase();
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await authRepository.findUserByEmail(normalizedEmail, true);
    if (
      !user ||
      user.forgotPasswordOTP !== hashedOTP ||
      !user.forgotPasswordExpire ||
      user.forgotPasswordExpire < new Date()
    ) {
      await authRepository.createAuditLog({
        email: normalizedEmail,
        action: 'otp_failed',
        status: 'failure',
        ipHash: hashIP(req.ip),
        message: 'Invalid or expired reset OTP',
      });
      throw new ErrorHandler('Invalid or expired OTP', 400);
    }

    // Set the new password — the userModel pre-save hook hashes it — and clear
    // the reset OTP so the same code can never be reused.
    user.password = password;
    user.forgotPasswordOTP = undefined;
    user.forgotPasswordExpire = undefined;

    // Security: a password reset invalidates every existing session and starts a
    // fresh one for the device that performed the reset.
    const sessionId = crypto.randomBytes(16).toString('hex');
    user.sessions = [this.generateSession(req, sessionId)];
    this.applyLoginContext(user, req);

    await authRepository.saveUser(user);
    this.geolocateLoginAsync(user._id, geo.getClientIp(req));

    await authRepository.createAuditLog({
      userId: user._id,
      action: 'password_changed',
      status: 'success',
      ipHash: hashIP(req.ip),
    });

    const accessToken = generateAccessToken(user._id, sessionId);
    const refreshToken = generateRefreshToken(user._id, sessionId);

    const html = getPasswordChangedTemplate(user.name);
    await enqueueEmail('passwordChanged', {
      email: user.email,
      subject: 'Soliva - Your Password Was Changed',
      html,
    });

    return { user, accessToken, refreshToken };
  }

  async login(email, password, req, isAdmin = false) {
    const normalizedEmail = String(email).toLowerCase();
    const user = await authRepository.findUserByEmail(normalizedEmail, true);
    const ipHash = hashIP(req.ip);

    if (!user || (isAdmin && user.role !== 'admin')) {
      await authRepository.createAuditLog({
        email: normalizedEmail,
        action: 'login_failed',
        status: 'failure',
        ipHash,
        message: 'Invalid credentials',
      });
      throw new ErrorHandler(isAdmin ? 'Invalid admin credentials' : 'Invalid email or password', 401);
    }

    if (!user.isVerified) throw new ErrorHandler('Please verify your email first', 401);

    if (user.status === 'blocked') {
      throw new ErrorHandler('Your account has been restricted. Please contact the admin.', 403, 'ACCOUNT_BLOCKED');
    }

    if (user.isLocked) {
      throw new ErrorHandler('Account is temporarily locked', 403);
    }

    // Passwordless (Google) accounts have no stored password — comparing against
    // it would throw a raw bcrypt "Illegal arguments: string, undefined" error.
    // Send the user to the right sign-in method instead.
    if (!user.password) {
      throw new ErrorHandler('This email is registered with Google sign-in. Please use "Continue with Google" to log in.', 401);
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) user.lockUntil = Date.now() + 15 * 60 * 1000;
      await authRepository.saveUser(user);
      
      await authRepository.createAuditLog({
        userId: user._id,
        action: 'login_failed',
        status: 'failure',
        ipHash,
      });
      throw new ErrorHandler('Invalid email or password', 401);
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    this.applyLoginContext(user, req);

    const sessionId = crypto.randomBytes(16).toString('hex');
    const newSession = this.generateSession(req, sessionId);
    user.sessions.push(newSession);
    await authRepository.saveUser(user);
    this.geolocateLoginAsync(user._id, geo.getClientIp(req));

    await authRepository.createAuditLog({
      userId: user._id,
      action: 'login_success',
      status: 'success',
      ipHash,
    });

    const accessToken = generateAccessToken(user._id, sessionId);
    const refreshToken = generateRefreshToken(user._id, sessionId);

    return { user, sessionId, accessToken, refreshToken };
  }

  async refreshToken(token, req) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await authRepository.findUserById(decoded.id);
      
      if (!user) throw new ErrorHandler('User not found', 404);
      
      const sessionIndex = user.sessions.findIndex(s => s.sessionId === decoded.sessionId);
      if (sessionIndex === -1 || user.sessions[sessionIndex].expiresAt < new Date()) {
        throw new ErrorHandler('Session expired', 401);
      }

      // Rotate Refresh Token
      const newSessionId = crypto.randomBytes(16).toString('hex');
      user.sessions[sessionIndex].sessionId = newSessionId;
      user.sessions[sessionIndex].lastActive = new Date();
      user.sessions[sessionIndex].expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      await authRepository.saveUser(user);

      const accessToken = generateAccessToken(user._id, newSessionId);
      const refreshToken = generateRefreshToken(user._id, newSessionId);

      return { user, sessionId: newSessionId, accessToken, refreshToken };
    } catch (err) {
      throw new ErrorHandler('Invalid token', 401);
    }
  }

  async logout(userId, sessionId) {
    const user = await authRepository.findUserById(userId);
    if (user) {
      user.sessions = user.sessions.filter(s => s.sessionId !== sessionId);
      await authRepository.saveUser(user);
    }
  }

  async logoutAll(userId) {
    const user = await authRepository.findUserById(userId);
    if (user) {
      user.sessions = [];
      await authRepository.saveUser(user);
    }
  }

  async revokeSession(userId, sessionId) {
    const user = await authRepository.findUserById(userId);
    if (user) {
      user.sessions = user.sessions.filter(s => s.sessionId !== sessionId);
      await authRepository.saveUser(user);
    }
  }

  async revokeOtherSessions(userId, currentSessionId) {
    const user = await authRepository.findUserById(userId);
    if (user) {
      user.sessions = user.sessions.filter(s => s.sessionId === currentSessionId);
      await authRepository.saveUser(user);
    }
  }

  /**
   * Google sign-in. The browser does the Firebase popup and sends us the
   * resulting ID token; we verify it server-side, then either log the matching
   * user in or create a fresh passwordless account — and issue the normal
   * Soliva JWT session either way, so the rest of the app treats it like any
   * other login.
   */
  async googleAuth(idToken, req) {
    if (!idToken || typeof idToken !== 'string') {
      throw new ErrorHandler('Missing Google credential', 400);
    }

    let decoded;
    try {
      decoded = await firebaseAdmin.verifyIdToken(idToken);
    } catch (err) {
      if (err.statusCode === 503) {
        throw new ErrorHandler('Google sign-in is not configured on the server', 503);
      }
      throw new ErrorHandler('Invalid or expired Google credential', 401);
    }

    const { uid, email, name, picture } = decoded;
    if (!email) {
      throw new ErrorHandler('Your Google account has no email address', 400);
    }
    const normalizedEmail = String(email).toLowerCase();
    const ipHash = hashIP(req.ip);

    const sessionId = crypto.randomBytes(16).toString('hex');
    const newSession = this.generateSession(req, sessionId);

    let user = await authRepository.findUserByEmail(normalizedEmail);

    if (user) {
      // Existing account → link Google on first use, then sign in.
      if (user.status === 'blocked') {
        throw new ErrorHandler('Your account has been restricted. Please contact the admin.', 403, 'ACCOUNT_BLOCKED');
      }
      if (user.isLocked) throw new ErrorHandler('Account is temporarily locked', 403);
      if (!user.googleId) user.googleId = uid;
      if (!user.avatarUrl && picture) user.avatarUrl = picture;
      if (!user.isVerified) {
        user.isVerified = true;
        user.verifiedAt = new Date();
      }
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      user.sessions.push(newSession);
      this.applyLoginContext(user, req);
      await authRepository.saveUser(user);

      await authRepository.createAuditLog({
        userId: user._id,
        action: 'login_success',
        status: 'success',
        ipHash,
        message: 'google',
      });
    } else {
      // New account → create passwordless Google user with a unique username.
      let username = normalizedEmail.split('@')[0].toLowerCase();
      const base = username;
      while (await authRepository.findUserByUsername(username)) {
        username = `${base}${crypto.randomBytes(2).toString('hex')}`;
      }

      const newUserData = {
        name: name || normalizedEmail.split('@')[0],
        username,
        email: normalizedEmail,
        googleId: uid,
        authProvider: 'google',
        avatarUrl: picture || null,
        isVerified: true,
        verifiedAt: new Date(),
        sessions: [newSession],
      };
      this.applyLoginContext(newUserData, req);
      user = await authRepository.createUser(newUserData);

      await authRepository.createAuditLog({
        userId: user._id,
        action: 'registration_initiated',
        status: 'success',
        ipHash,
        message: 'google_signup',
      });

      // Welcome email — best-effort, never blocks sign-in.
      try {
        const html = getWelcomeTemplate(user.name);
        await enqueueEmail('welcomeEmail', {
          email: user.email,
          subject: 'Welcome to Soliva!',
          html,
        });
      } catch (_) {
        /* ignore — sign-in already succeeded */
      }
    }

    this.geolocateLoginAsync(user._id, geo.getClientIp(req));

    const accessToken = generateAccessToken(user._id, sessionId);
    const refreshToken = generateRefreshToken(user._id, sessionId);

    return { user, accessToken, refreshToken };
  }

  /**
   * Stamp synchronous login telemetry (time, IP, device/browser/OS) onto a user
   * doc or a plain createUser payload. Safe — never throws, never awaits.
   * Accepts a mongoose doc OR a plain object so it works for both existing-user
   * logins and new-user creation paths.
   */
  applyLoginContext(target, req) {
    try {
      const { browserInfo, osInfo, deviceInfo } = geo.parseUserAgent(req.headers['user-agent']);
      target.lastLoginAt  = new Date();
      target.lastLoginIP  = geo.getClientIp(req);
      target.deviceInfo   = deviceInfo;
      target.browserInfo  = browserInfo;
      target.osInfo       = osInfo;
    } catch { /* telemetry must never break auth */ }
  }

  /**
   * Fire-and-forget IP → city/state/country/ISP enrichment. Runs after the
   * login response is sent; failures are swallowed so auth is never affected.
   */
  geolocateLoginAsync(userId, ip) {
    geo.lookupIpLocation(ip)
      .then((loc) => { if (loc) return User.updateOne({ _id: userId }, { $set: loc }); })
      .catch(() => {});
  }

  /**
   * Persist precise GPS coordinates (opt-in, from the browser) and the
   * reverse-geocoded area/locality. Validates the coordinate range; geocoding
   * failure is non-fatal (coordinates are still stored).
   */
  async updateGpsLocation(userId, latitude, longitude) {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new ErrorHandler('Invalid coordinates', 400);
    }
    const set = { lastLatitude: lat, lastLongitude: lon };
    const geocoded = await geo.reverseGeocode(lat, lon);
    if (geocoded) {
      for (const [k, v] of Object.entries(geocoded)) if (v) set[k] = v;
    }
    await User.updateOne({ _id: userId }, { $set: set });
    return set;
  }

  generateSession(req, sessionId) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    // Simplified device/browser detection logic
    const browser = userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Safari') ? 'Safari' : userAgent.includes('Firefox') ? 'Firefox' : 'Other';
    const device = userAgent.includes('Mobile') ? 'Mobile' : 'Desktop';

    return {
      sessionId,
      ipHash: hashIP(req.ip),
      device,
      browser,
      lastActive: Date.now(),
      createdAt: Date.now(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
  }
}

module.exports = new AuthService();
