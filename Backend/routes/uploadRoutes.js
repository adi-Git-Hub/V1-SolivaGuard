const express = require('express');
const upload = require('../middleware/multer');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/authMiddleware');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');

const router = express.Router();
const fs = require('fs');

const checkMagicBytes = (filePath) => {
  try {
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    const hex = buffer.toString('hex').toUpperCase();

    const isJPEG = hex.startsWith('FFD8FF');
    const isPNG = hex.startsWith('89504E470D0A1A0A');
    const isWEBP = hex.startsWith('52494646') && hex.slice(16, 24) === '57454250';

    return isJPEG || isPNG || isWEBP;
  } catch (err) {
    return false;
  }
};

// @desc    Upload an image
// @route   POST /api/v1/upload
// @access  Private/Admin
router.post(
  '/',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  upload.single('image'),
  catchAsyncErrors(async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    if (!checkMagicBytes(req.file.path)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Invalid file type. File signature does not match expected image types.' });
    }

    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      url: url,
    });
  })
);

module.exports = router;