const fs = require('fs');
const path = require('path');
const User = require('../models/userModel');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const sendResponse = require('../utils/sendResponse');
const logger = require('../utils/logger');
const phoneOtpService = require('../services/phoneOtpService');
const authRepository = require('../repositories/authRepository');
const { phoneLookupVariants } = require('../utils/phone');
const crypto = require('crypto');

// @desc    Upload / replace the signed-in user's avatar.
// @route   POST /api/v1/users/me/avatar
// @access  Private
//
// Expects a multipart upload with field name "avatar". Multer enforces image
// MIME types and a 2 MB size limit (middleware/multer.js).
exports.updateAvatar = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) {
    throw new ErrorHandler('Please upload an image file', 400);
  }

  const user = await User.findById(req.user.id);
  if (!user) throw new ErrorHandler('User not found', 404);

  // Delete the previous file on disk if it lived under our /uploads dir.
  // Failures here are non-fatal — orphaned files are cheap and can be cleaned
  // up out-of-band later.
  if (user.avatarUrl) {
    try {
      const prevPath = user.avatarUrl.split('/uploads/').pop();
      if (prevPath) {
        const abs = path.join(__dirname, '..', 'uploads', prevPath);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
      }
    } catch (err) {
      logger.warn(`[AVATAR] Failed to remove previous file: ${err.message}`);
    }
  }

  // Build a fully-qualified HTTPS URL. When behind nginx (which sets
  // X-Forwarded-Proto: https), trust proxy makes req.protocol return "https".
  // We also read the header directly as a belt-and-suspenders guard.
  const proto = req.get('x-forwarded-proto') || req.protocol;
  const publicUrl = `${proto}://${req.get('host')}/uploads/${req.file.filename}`;
  user.avatarUrl = publicUrl;
  await user.save({ validateBeforeSave: false });

  return sendResponse(res, {
    data: { user: { id: user._id, avatarUrl: user.avatarUrl } },
  });
});

// @desc    Remove the signed-in user's avatar (revert to initials fallback).
// @route   DELETE /api/v1/users/me/avatar
// @access  Private
exports.removeAvatar = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ErrorHandler('User not found', 404);

  if (user.avatarUrl) {
    try {
      const prevPath = user.avatarUrl.split('/uploads/').pop();
      if (prevPath) {
        const abs = path.join(__dirname, '..', 'uploads', prevPath);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
      }
    } catch (err) {
      logger.warn(`[AVATAR] Failed to remove file on delete: ${err.message}`);
    }
  }

  user.avatarUrl = null;
  await user.save({ validateBeforeSave: false });

  return sendResponse(res, {
    data: { user: { id: user._id, avatarUrl: null } },
  });
});

// @desc    Change the signed-in user's phone number (Phone OTP verified).
// @route   PATCH /api/v1/users/me/phone
// @access  Private
//
// The client first proves ownership of the new number via the public phone-OTP
// flow (/auth/phone/send-otp → /auth/phone/verify) and passes the resulting
// short-lived `phoneVerifyToken` here. We re-check the token matches the
// submitted number, enforce uniqueness, then persist the canonical 10-digit
// national form.
exports.updatePhone = catchAsyncErrors(async (req, res, next) => {
  const { phone, phoneVerifyToken } = req.body;

  // Throws (400) if the token is missing / expired / for a different number.
  const national = phoneOtpService.verifyToken(phoneVerifyToken, phone);

  // Reject if another account already owns this number (any stored format).
  const variants = phoneLookupVariants(national);
  const clash = await User.findOne({
    phoneNumber: { $in: variants },
    _id: { $ne: req.user.id },
  });
  if (clash) {
    throw new ErrorHandler('This mobile number is already linked to another account', 409, 'PHONE_TAKEN');
  }

  const user = await User.findById(req.user.id);
  if (!user) throw new ErrorHandler('User not found', 404);

  user.phoneNumber = national;
  await user.save({ validateBeforeSave: false });

  await authRepository.createAuditLog({
    userId: user._id,
    action: 'phone_updated',
    status: 'success',
    ipHash: crypto.createHash('sha256').update(req.ip || '').digest('hex'),
  });

  return sendResponse(res, {
    message: 'Mobile number updated',
    data: { user: { id: user._id, phoneNumber: user.phoneNumber } },
  });
});
