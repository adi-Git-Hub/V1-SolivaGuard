const User = require('../models/userModel');
const PendingRegistration = require('../models/pendingRegistrationModel');
const AuthAuditLog = require('../models/authAuditLogModel');
const EmailOtp = require('../models/emailOtpModel');
const PhoneOtp = require('../models/phoneOtpModel');

class AuthRepository {
  async findUserByEmail(email, selectPassword = false) {
    let query = User.findOne({ email });
    if (selectPassword) query = query.select('+password');
    return await query;
  }

  async findUserByUsername(username) {
    return await User.findOne({ username });
  }

  async findUserByPhone(phoneNumber) {
    return await User.findOne({ phoneNumber });
  }

  // Match a user against several possible stored phone formats (10-digit,
  // +91…, 91…, 0…) so phone login works regardless of how the number was saved.
  async findUserByPhoneVariants(variants) {
    return await User.findOne({ phoneNumber: { $in: variants } });
  }

  async findUserById(id) {
    return await User.findById(id);
  }

  async findUserBySession(sessionId) {
    return await User.findOne({ 'sessions.sessionId': sessionId });
  }

  async findPendingRegistration(email) {
    return await PendingRegistration.findOne({ email });
  }

  async createAuditLog(logData) {
    return await AuthAuditLog.create(logData);
  }

  async updatePendingRegistration(email, data) {
    return await PendingRegistration.findOneAndUpdate(
      { email },
      { $set: data },
      { upsert: true, new: true }
    );
  }

  async deletePendingRegistration(email) {
    return await PendingRegistration.deleteOne({ email });
  }

  // ── Passwordless sign-in OTP challenges ──
  async findEmailOtp(email) {
    return await EmailOtp.findOne({ email });
  }

  async upsertEmailOtp(email, data) {
    return await EmailOtp.findOneAndUpdate(
      { email },
      { $set: data },
      { upsert: true, new: true }
    );
  }

  async incrementEmailOtpAttempts(email) {
    return await EmailOtp.findOneAndUpdate(
      { email },
      { $inc: { attempts: 1 } },
      { new: true }
    );
  }

  async deleteEmailOtp(email) {
    return await EmailOtp.deleteOne({ email });
  }

  // ── Phone sign-in / verification OTP challenges (keyed by 10-digit national) ──
  async findPhoneOtp(phone) {
    return await PhoneOtp.findOne({ phone });
  }

  async upsertPhoneOtp(phone, data) {
    return await PhoneOtp.findOneAndUpdate(
      { phone },
      { $set: data },
      { upsert: true, new: true }
    );
  }

  async incrementPhoneOtpAttempts(phone) {
    return await PhoneOtp.findOneAndUpdate(
      { phone },
      { $inc: { attempts: 1 } },
      { new: true }
    );
  }

  async deletePhoneOtp(phone) {
    return await PhoneOtp.deleteOne({ phone });
  }

  async saveUser(user) {
    return await user.save();
  }

  async createUser(userData) {
    return await User.create(userData);
  }
}

module.exports = new AuthRepository();
