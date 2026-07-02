const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      logger.error('CRITICAL: Razorpay credentials are not set in the environment.');
      // Keep it somewhat tolerant on start so the server boots, but fail loud.
    }
    this.razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'dummy_id',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
    });
  }

  async createRazorpayOrder(amount) {
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'dummy_id') {
      throw new Error('Razorpay credentials are required in production');
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };

    try {
      const order = await this.razorpayInstance.orders.create(options);
      logger.info(`[PAYMENT] Razorpay Order Created: ${order.id}`);
      return order;
    } catch (error) {
      logger.error(`[PAYMENT] Razorpay Order Creation Failed: ${error.message}`);
      throw error;
    }
  }

  verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature) {
    if (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET === 'dummy_secret') {
       throw new Error('Razorpay secret is not configured');
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    const isValid = (razorpay_signature.length === expectedSign.length) && 
                    crypto.timingSafeEqual(Buffer.from(razorpay_signature), Buffer.from(expectedSign));

    if (isValid) {
      logger.info(`[PAYMENT] Signature Verified for Order: ${razorpay_order_id}`);
    } else {
      logger.warn(`[PAYMENT] Signature Verification Failed for Order: ${razorpay_order_id}`);
    }
    
    return isValid;
  }
}

module.exports = new PaymentService();