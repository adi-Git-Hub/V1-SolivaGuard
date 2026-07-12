const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsyncErrors = require('./catchAsyncErrors');
const ErrorHandler = require('../utils/errorHandler');

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    return next(new ErrorHandler('Login first to access this resource.', 401));
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
       return next(new ErrorHandler('User not found', 404));
    }

    // Verify the session is still active and valid
    const session = user.sessions.find(s => s.sessionId === decoded.sessionId);
    if (!session || session.expiresAt < new Date()) {
       return next(new ErrorHandler('Session expired or revoked. Please login again.', 401));
    }

    req.user = user;
    req.sessionId = decoded.sessionId;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
       return next(new ErrorHandler('Access token expired', 401));
    }
    return next(new ErrorHandler('Invalid access token', 401));
  }
});

// Optional auth for endpoints that must serve both signed-in users and guests
// through the same code path (e.g. order creation). Never rejects — a
// missing/invalid/expired token just leaves req.user unset instead of erroring,
// so the route handler treats the request as a guest.
exports.attachUserIfPresent = catchAsyncErrors(async (req, res, next) => {
  const { accessToken } = req.cookies;
  if (!accessToken) return next();

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next();

    const session = user.sessions.find(s => s.sessionId === decoded.sessionId);
    if (!session || session.expiresAt < new Date()) return next();

    req.user = user;
    req.sessionId = decoded.sessionId;
  } catch (_) {
    // Invalid/expired token — proceed as a guest rather than failing the request.
  }
  next();
});

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user.role} is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};
