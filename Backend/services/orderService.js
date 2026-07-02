const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const paymentService = require('./paymentService');
const ErrorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { enqueuePaymentRecovery } = require('../queues/paymentQueue');
const { enqueueInventoryRecovery } = require('../queues/inventoryQueue');
const { enqueueEmail } = require('../queues/emailQueue');
const { getOrderConfirmationTemplate } = require('../utils/emailTemplates');
const { generateOrderDocuments } = require('./pdfService');
const User = require('../models/userModel');

// Public origin used to build absolute document links in emails.
const PUBLIC_URL = (process.env.PUBLIC_URL || 'https://solivaguard.com').replace(/\/$/, '');

const isReplicaSet = async () => {
  try {
    const admin = mongoose.connection.db.admin();
    await admin.command({ replSetGetStatus: 1 });
    return true;
  } catch {
    return false;
  }
};

class OrderService {
  async createOrder(data, userId, idempotencyKey) {
    const useTransaction = await isReplicaSet();
    const session = useTransaction ? await mongoose.startSession() : null;
    if (session) session.startTransaction();

    try {
      const sessionOpt = session ? { session } : {};

      if (idempotencyKey) {
        const existingOrder = await Order.findOne({ idempotencyKey }).session(session);
        if (existingOrder) {
          if (session) { await session.abortTransaction(); session.endSession(); }
          logger.info(`[ORDER] Idempotent request. Returned existing order: ${existingOrder._id}`);
          return {
             order: existingOrder,
             razorpayOrderId: existingOrder.paymentInfo.razorpay_order_id,
             amount: Math.round(existingOrder.totalPrice * 100),
             razorpayKeyId: process.env.RAZORPAY_KEY_ID,
          };
        }
      }

      const { shippingInfo, orderItems, taxPrice, shippingPrice } = data;

      let serverItemsPrice = 0;
      const safeOrderItems = [];
      for (const item of orderItems) {
        let productRef = item.product;
        let realPrice = item.price; // Default to client provided price for showcase items

        if (mongoose.Types.ObjectId.isValid(productRef)) {
          const product = await Product.findOneAndUpdate(
            { _id: productRef, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { new: true, ...sessionOpt }
          );

          if (!product) {
            const exists = await Product.exists({ _id: productRef });
            if (exists) {
              throw new ErrorHandler(`Product ${item.name} is out of stock or insufficient quantity`, 400);
            }
            // Valid-looking id but no such product → treat as a showcase item.
            productRef = new mongoose.Types.ObjectId();
          } else {
            realPrice = product.price; // Use authoritative price from database
          }
        } else {
          // Not a real ObjectId (e.g. "soliva-sunwrap") → showcase item.
          productRef = new mongoose.Types.ObjectId();
        }

        serverItemsPrice += realPrice * item.quantity;
        safeOrderItems.push({ ...item, product: productRef, price: realPrice });
      }

      const serverTotalPrice = serverItemsPrice + (taxPrice || 0) + (shippingPrice || 0);

      const razorpayOrder = await paymentService.createRazorpayOrder(serverTotalPrice);

      const orderData = {
        shippingInfo,
        orderItems: safeOrderItems,
        itemsPrice: serverItemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice: serverTotalPrice,
        paymentInfo: {
          razorpay_order_id: razorpayOrder.id,
          status: 'pending',
        },
        orderStatus: 'pending',
        events: [
          { status: 'pending', message: 'Order created and awaiting payment' }
        ],
        user: userId,
        idempotencyKey,
      };

      let createdOrder;
      if (session) {
        const order = await Order.create([orderData], { session });
        createdOrder = order[0];
      } else {
        createdOrder = await Order.create(orderData);
      }

      await Cart.findOneAndUpdate(
        { user: userId },
        { $set: { cartItems: [], totalPrice: 0 } },
        sessionOpt
      );

      if (session) { await session.commitTransaction(); session.endSession(); }

      logger.info(`[ORDER] New Order Created: ${createdOrder._id} for User: ${userId}`);

      try {
        await enqueueInventoryRecovery(createdOrder._id, orderItems, 15 * 60 * 1000);
        await enqueuePaymentRecovery(createdOrder._id, razorpayOrder.id, 30 * 60 * 1000);
      } catch (qErr) {
        logger.warn(`[ORDER] Background job enqueue skipped: ${qErr.message}`);
      }

      return {
        order: createdOrder,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        // Return the SAME key the order was created with so the frontend
        // checkout always matches the order — prevents key/order mismatch
        // ("Error in opening checkout") if VITE_RAZORPAY_KEY_ID drifts.
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      };
    } catch (error) {
      if (session) { await session.abortTransaction(); session.endSession(); }
      logger.error(`[TRANSACTION ERROR] Order creation failed: ${error.message}`);
      throw error;
    }
  }

  async verifyPayment(data) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = data;

    const order = await Order.findById(orderId);
    if (!order) {
      throw new ErrorHandler('Order not found', 404);
    }

    if (order.paymentInfo.razorpay_order_id !== razorpay_order_id) {
      logger.warn(`[PAYMENT] Razorpay Order ID mismatch for Order: ${orderId}`);
      throw new ErrorHandler('Payment validation failed', 400);
    }

    const isValid = paymentService.verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      logger.warn(`[PAYMENT] Invalid Payment Signature for Order: ${orderId}`);
      throw new ErrorHandler('Invalid signature sent!', 400);
    }

    if (order.paymentInfo.status === 'paid' || order.orderStatus === 'paid') {
      logger.info(`[PAYMENT] Order ${orderId} is already paid. Idempotent return.`);
      return true;
    }

    order.paymentInfo = {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      status: 'paid',
    };

    if (order.orderStatus === 'pending' || order.orderStatus === 'paid') {
      // Payment done → start the fulfilment timeline at "Order Confirmed".
      order.orderStatus = 'confirmed';
      order.events.push({ status: 'paid', message: 'Payment verified successfully via Razorpay' });
      order.events.push({ status: 'confirmed', message: 'Order confirmed — preparing for processing' });
    }

    await order.save();

    logger.info(`[PAYMENT] Order ${orderId} marked as PAID & CONFIRMED`);

    // Generate invoice/receipt PDFs + send the confirmation email in the
    // BACKGROUND so this response returns immediately (~200ms). Previously the
    // awaited PDF + email step blocked verify for 6-8s, leaving the user on a
    // "Verifying payment…" loader and a stuck post-payment screen.
    setImmediate(() => {
      this.finalizePaidOrder(orderId).catch((e) =>
        logger.error(`[ORDER] Async finalize failed for ${orderId}: ${e.message}`)
      );
    });

    return true;
  }

  /**
   * Post-payment side effects (documents + email). Runs out-of-band; failures
   * are logged and never affect the payment-verification response.
   */
  async finalizePaidOrder(orderId) {
    const order = await Order.findById(orderId);
    if (!order) return;
    const user = await User.findById(order.user).select('name email');

    try {
      const docs = await generateOrderDocuments(order, user);
      if (docs.invoiceUrl) order.invoiceUrl = docs.invoiceUrl;
      if (docs.receiptUrl) order.receiptUrl = docs.receiptUrl;
      if (docs.invoiceNumber) order.invoiceNumber = docs.invoiceNumber;
      if (docs.receiptNumber) order.receiptNumber = docs.receiptNumber;
      order.documentsGeneratedAt = new Date();
      await order.save();
      logger.info(`[ORDER] Documents generated for ${orderId}: ${order.invoiceNumber}, ${order.receiptNumber}`);
    } catch (docErr) {
      logger.error(`[ORDER] Document generation skipped for ${orderId}: ${docErr.message}`);
    }

    try {
      if (user) {
        const html = getOrderConfirmationTemplate({
          customerName: order.shippingInfo?.fullName || user.name,
          orderId: order._id,
          orderItems: order.orderItems,
          totalPrice: order.totalPrice,
          shippingInfo: order.shippingInfo,
          trackUrl: `${PUBLIC_URL}/profile/orders/${order._id}`,
          invoiceUrl: order.invoiceUrl ? `${PUBLIC_URL}${order.invoiceUrl}` : null,
          receiptUrl: order.receiptUrl ? `${PUBLIC_URL}${order.receiptUrl}` : null,
        });
        await enqueueEmail('orderConfirmation', {
          email: user.email,
          subject: 'Your SOLIVA Order Has Been Confirmed ✨',
          html,
        });
      }
    } catch (emailErr) {
      logger.warn(`[ORDER] Confirmation email skipped: ${emailErr.message}`);
    }
  }

  async getSingleOrder(id) {
    const order = await Order.findById(id).populate('user', 'name email');
    if (!order) {
      throw new ErrorHandler('Order not found with this ID', 404);
    }
    return order;
  }

  async getUserOrders(userId) {
    return await Order.find({ user: userId });
  }

  async cancelOrder(orderId, userId) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ErrorHandler('Order not found', 404);
    }

    if (order.user.toString() !== userId.toString()) {
      throw new ErrorHandler('You are not authorized to cancel this order', 403);
    }

    const validCancelStates = ['pending', 'confirmed', 'paid', 'packed'];
    if (!validCancelStates.includes(order.orderStatus)) {
      throw new ErrorHandler(`Cannot cancel order in ${order.orderStatus} state`, 400);
    }

    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      );
    }

    order.orderStatus = 'cancelled';
    await order.save();

    logger.info(`[ORDER] Order Cancelled and stock restored: ${orderId} by User: ${userId}`);
    return true;
  }

  async getAllOrders() {
    const orders = await Order.find();
    let totalAmount = 0;
    orders.forEach((order) => {
      totalAmount += order.totalPrice;
    });
    return { orders, totalAmount };
  }

  async updateOrder(orderId, status) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ErrorHandler('Order not found with this ID', 404);
    }

    const validTransitions = {
      'pending': ['paid', 'cancelled'],
      'paid': ['confirmed', 'packed', 'cancelled', 'refunded'],
      'confirmed': ['packed', 'shipped', 'cancelled', 'refunded'],
      'packed': ['shipped', 'cancelled', 'refunded'],
      'shipped': ['out_for_delivery', 'delivered', 'cancelled', 'refunded'],
      'out_for_delivery': ['delivered', 'cancelled', 'refunded'],
      'delivered': ['refunded'],
      'cancelled': [],
      'refunded': [],
    };

    const oldStatus = order.orderStatus;

    if (!validTransitions[oldStatus].includes(status)) {
      throw new ErrorHandler(`Invalid state transition from ${oldStatus} to ${status}`, 400);
    }

    if ((status === 'cancelled' || status === 'refunded') && (oldStatus !== 'cancelled' && oldStatus !== 'refunded')) {
       for (const item of order.orderItems) {
          await Product.findByIdAndUpdate(
             item.product,
             { $inc: { stock: item.quantity } }
          );
       }
    }

    order.orderStatus = status;
    order.events.push({ status, message: `Order status updated to ${status}` });
    
    if (status === 'delivered') {
      order.deliveredAt = Date.now();
    }

    await order.save();

    logger.info(`[ADMIN] Order Status Updated: ${orderId} (${oldStatus} -> ${status})`);
    return order;
  }
}

module.exports = new OrderService();
