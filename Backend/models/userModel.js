const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your name'],
      maxLength: [50, 'Name cannot exceed 50 characters'],
    },
    username: {
      type: String,
      required: [true, 'Please enter your username'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'Please enter your email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      // Passwordless by default — accounts authenticate via email OTP or Google.
      // Kept only for legacy accounts and the admin login, so it's optional and
      // never required at creation. (minlength is enforced only when a value is
      // actually set, e.g. the seeded admin.)
      minlength: [12, 'Password must be at least 12 characters'],
      select: false,
    },
    // OAuth identity — set when the account signs in with Google. Sparse-unique
    // so the many users without a googleId don't collide on the index.
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    // 'guest' = auto-created at guest checkout, no password, not a real signed-up
    // account yet. Flips to 'registered' the moment a password is set (see
    // authService.createPassword) or the user signs in via OTP/Google under the
    // same email. Defaults to 'registered' so every pre-existing account (which
    // predates this field) reads as a normal account with no migration needed.
    accountType: {
      type: String,
      enum: ['guest', 'registered'],
      default: 'registered',
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // Account moderation state. `blocked` users are rejected at login and are
    // surfaced separately in the admin customers console. `deleted` marks a
    // self-service account deletion (soft delete): personal data is anonymized,
    // sessions wiped, and login blocked, while order/refund history is kept.
    // Defaults to active.
    status: {
      type: String,
      enum: ['active', 'blocked', 'deleted'],
      default: 'active',
      index: true,
    },
    // When the account was soft-deleted (self-service). Null for live accounts.
    deletedAt: { type: Date, default: null },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verifiedAt: Date,
    // Last successful login — powers the "Active / Inactive" customer signal
    // and the customer detail drawer. Updated on every successful login.
    lastLoginAt: Date,

    // ── Login location & device telemetry (admin-only) ─────────────────────
    // Captured best-effort on every successful login. IP-derived fields are
    // filled asynchronously; GPS fields are filled only if the browser grants
    // geolocation permission. None of this is ever exposed to the customer.
    lastLoginIP:      { type: String, default: null },
    lastLoginCity:    { type: String, default: null },
    lastLoginState:   { type: String, default: null },
    lastLoginCountry: { type: String, default: null },
    lastLoginISP:     { type: String, default: null },
    deviceInfo:       { type: String, default: null },  // e.g. "iPhone", "Mac"
    browserInfo:      { type: String, default: null },  // e.g. "Chrome"
    osInfo:           { type: String, default: null },  // e.g. "macOS"
    // Precise GPS (opt-in, reverse-geocoded). Coordinates are admin-only.
    lastLatitude:     { type: Number, default: null },
    lastLongitude:    { type: Number, default: null },
    areaName:         { type: String, default: null },  // e.g. "Dharampeth"
    subLocality:      { type: String, default: null },
    locality:         { type: String, default: null },
    // Public URL of the user's avatar image. `null` means "no upload" — the
    // frontend renders a deterministic initials-on-color fallback in that case.
    avatarUrl: {
      type: String,
      default: null,
    },
    emailOTP: String,
    otpExpire: { type: Date, index: true },
    forgotPasswordOTP: String,
    forgotPasswordExpire: { type: Date, index: true },
    
    // Login Security
    loginAttempts: {
      type: Number,
      required: true,
      default: 0,
    },
    lockUntil: {
      type: Number,
    },
    
    // Device Session Tracking
    sessions: [
      {
        sessionId: { type: String, index: true },
        ipHash: String,
        device: String,
        browser: String,
        lastActive: { type: Date, default: Date.now },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, index: true },
      },
    ],
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// Virtual for lock status
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  // The verified-registration flow stores an already-bcrypt-hashed password
  // (hashed once in authService.register). Skip re-hashing it here, otherwise
  // the password is double-hashed and login can never match. Plain passwords
  // (e.g. from a password reset) don't match this pattern and hash normally.
  if (/^\$2[aby]\$\d{2}\$/.test(this.password)) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function (sessionId) {
  return jwt.sign({ id: this._id, sessionId }, process.env.JWT_SECRET, {
    expiresIn: '15m', // Short-lived access token
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate 6-digit OTP
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash OTP and set to field
  const hashedOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  return { otp, hashedOTP };
};

module.exports = mongoose.model('User', userSchema);
