const mongoose = require('mongoose');

const authAuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'login_success',
        'login_failed',
        'logout',
        'logout_all',
        'registration_initiated',
        'email_verified',
        'otp_sent',
        'otp_failed',
        'password_reset_initiated',
        'password_changed',
        'password_created',
        'account_deletion_initiated',
        'account_deleted',
        'phone_otp_sent',
        'phone_otp_failed',
        'phone_verified',
        'phone_updated',
        'suspicious_activity',
      ],
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      required: true,
    },
    ipHash: String,
    device: String,
    browser: String,
    message: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

authAuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuthAuditLog', authAuditLogSchema);
