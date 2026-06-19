const fs = require('fs');
const path = require('path');
const User = require('../models/userModel');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const sendResponse = require('../utils/sendResponse');
const logger = require('../utils/logger');

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
