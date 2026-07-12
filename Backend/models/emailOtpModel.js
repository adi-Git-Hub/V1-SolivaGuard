const mongoose = require('mongoose');

// One passwordless sign-in challenge per email. Works for BOTH new and existing
// emails: request-otp upserts a row here, verify-otp checks it, then either logs
// the existing user in or auto-creates a passwordless account. The document is
// short-lived and auto-removed by a TTL index once it expires.
const emailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    // Failed verify attempts — the challenge is burned after too many.
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// TTL: Mongo removes the doc the moment `expiresAt` passes.
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('EmailOtp', emailOtpSchema);
