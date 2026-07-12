const mongoose = require('mongoose');

// One phone-OTP challenge per mobile number. Mirrors emailOtpModel: request-otp
// upserts a row, verify-otp checks it, then the challenge is burned. The doc is
// short-lived and auto-removed by a TTL index once it expires.
const phoneOtpSchema = new mongoose.Schema(
  {
    // Canonical 10-digit national number (see utils/phone.normalizePhone).
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    otpHash: { type: String, required: true },
    // What the code is for — audit/context only; verification is by phone.
    purpose: {
      type: String,
      enum: ['login', 'verify', 'update'],
      default: 'verify',
    },
    expiresAt: { type: Date, required: true },
    // Failed verify attempts — the challenge is burned after too many.
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// TTL: Mongo removes the doc the moment `expiresAt` passes.
phoneOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PhoneOtp', phoneOtpSchema);
