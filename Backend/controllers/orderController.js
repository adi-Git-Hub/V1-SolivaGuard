const orderService = require('../services/orderService');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/errorHandler');
const sendResponse = require('../utils/sendResponse');

// @desc    Create new order & Razorpay order
// @route   POST /api/v1/orders
// @access  Private
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const idempotencyKey = req.headers['x-idempotency-key'];
  const result = await orderService.createOrder(req.body, req.user.id, idempotencyKey);

  return sendResponse(res, {
    statusCode: 201,
    data: result,
  });
});

// @desc    Verify Razorpay Payment
// @route   POST /api/v1/orders/verify-payment
// @access  Private
exports.verifyPayment = catchAsyncErrors(async (req, res, next) => {
  await orderService.verifyPayment(req.body);

  return sendResponse(res, {
    message: 'Payment verified successfully',
  });
});

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await orderService.getSingleOrder(req.params.id);

  if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorHandler('Not authorized to access this order', 403));
  }

  return sendResponse(res, {
    data: { order },
  });
});

// @desc    Get logged in user orders
// @route   GET /api/v1/orders/me
// @access  Private
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await orderService.getUserOrders(req.user.id);

  return sendResponse(res, {
    data: { orders },
  });
});

// @desc    Cancel Order (User)
// @route   PUT /api/v1/orders/:id/cancel
// @access  Private
exports.cancelOrder = catchAsyncErrors(async (req, res, next) => {
  await orderService.cancelOrder(req.params.id, req.user.id);

  return sendResponse(res, {
    message: 'Order cancelled successfully',
  });
});

// @desc    Get all orders -- Admin
// @route   GET /api/v1/admin/orders
// @access  Private/Admin
exports.getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const result = await orderService.getAllOrders();

  return sendResponse(res, {
    data: result,
  });
});

// @desc    Update Order Status -- Admin
// @route   PUT /api/v1/admin/orders/:id
// @access  Private/Admin
exports.updateOrderStatus = catchAsyncErrors(async (req, res, next) => {
  const order = await orderService.updateOrder(req.params.id, req.body.status);

  return sendResponse(res, {
    data: { order },
  });
});