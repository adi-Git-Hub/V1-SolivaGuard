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

  /**
   * Initiate a refund against a captured Razorpay payment.
   * @param {string} razorpay_payment_id  The payment to refund (pay_...).
   * @param {number} amount               Amount in RUPEES (converted to paise here).
   * @param {object} [notes]              Optional key/value notes stored on the refund.
   * @returns {Promise<object>} Razorpay refund object ({ id, status, ... }).
   *          status is one of 'pending' | 'processed' | 'failed'.
   */
  async refundPayment(razorpay_payment_id, amount, notes = {}) {
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'dummy_id') {
      throw new Error('Razorpay credentials are required in production');
    }
    if (!razorpay_payment_id) {
      throw new Error('A Razorpay payment id is required to issue a refund');
    }

    try {
      const refund = await this.razorpayInstance.payments.refund(razorpay_payment_id, {
        amount: Math.round(amount * 100),
        speed: 'normal',
        notes,
      });
      logger.info(`[PAYMENT] Refund initiated: ${refund.id} (${refund.status}) for payment ${razorpay_payment_id}`);
      return refund;
    } catch (error) {
      logger.error(`[PAYMENT] Refund failed for payment ${razorpay_payment_id}: ${error.message}`);
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