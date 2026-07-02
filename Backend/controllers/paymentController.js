const crypto = require('crypto');
const logger = require('../utils/logger');
const Order = require('../models/orderModel');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const sendResponse = require('../utils/sendResponse');

// @desc    Handle Razorpay Webhooks
// @route   POST /api/v1/payment/webhook
// @access  Public
exports.razorpayWebhook = catchAsyncErrors(async (req, res, next) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || secret === 'dummy_webhook_secret') {
    throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured');
  }
  
  const signature = req.headers['x-razorpay-signature'] || '';
  const payloadStr = req.rawBody || JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadStr)
    .digest('hex');

  const isValid = (signature.length === expectedSignature.length) && 
                  crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (isValid) {
    const event = req.body.event;
    const payload = req.body.payload;

    logger.info(`[WEBHOOK] Received Razorpay Event: ${event}`);

    // Offload processing or handle idempotently
    if (event === 'order.paid' || event === 'payment.captured') {
      const razorpayOrderId = payload.payment.entity.order_id;
      const order = await Order.findOne({ 'paymentInfo.razorpay_order_id': razorpayOrderId });

      if (order && order.orderStatus === 'pending') {
         order.orderStatus = 'paid';
         order.paymentInfo.status = 'paid';
         order.paymentInfo.razorpay_payment_id = payload.payment.entity.id;
         await order.save();
         logger.info(`[WEBHOOK] Order ${order._id} reconciled to PAID via webhook.`);
      } else {
         logger.info(`[WEBHOOK] Order already processed or not found for RP_ID: ${razorpayOrderId}`);
      }
    }
    
    return sendResponse(res, { statusCode: 200, message: 'Webhook processed' });
  } else {
    logger.warn('[WEBHOOK] Invalid Razorpay Signature');
    return sendResponse(res, { statusCode: 400, success: false, message: 'Invalid signature' });
  }
});