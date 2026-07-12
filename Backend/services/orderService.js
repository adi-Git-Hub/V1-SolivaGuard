const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const paymentService = require('./paymentService');
const authService = require('./authService');
const ErrorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { enqueuePaymentRecovery } = require('../queues/paymentQueue');
const { enqueueInventoryRecovery } = require('../queues/inventoryQueue');
const { enqueueEmail } = require('../queues/emailQueue');
const {
  getOrderConfirmationTemplate,
  getOrderCancellationCustomerTemplate,
  getOrderCancellationAdminTemplate,
} = require('../utils/emailTemplates');
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

      const { shippingInfo, orderItems, taxPrice, shippingPrice, guestEmail } = data;

      // Single code path for authenticated + guest checkout: an authenticated
      // request already has userId; a guest request resolves (or creates) the
      // account its order attaches to from guestEmail.
      let resolvedUserId = userId;
      if (!resolvedUserId) {
        if (!guestEmail) {
          throw new ErrorHandler('Email is required to place an order', 400);
        }
        const guestUser = await authService.findOrCreateGuestUser(guestEmail, shippingInfo);
        resolvedUserId = guestUser._id;
      }

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
        user: resolvedUserId,
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
        { user: resolvedUserId },
        { $set: { cartItems: [], totalPrice: 0 } },
        sessionOpt
      );

      if (session) { await session.commitTransaction(); session.endSession(); }

      logger.info(`[ORDER] New Order Created: ${createdOrder._id} for User: ${resolvedUserId}`);

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

  // Statuses a customer may still cancel from. Business rule: cancellation is
  // allowed ONLY before the order is packed. Once packed/shipped/etc the button
  // is hidden on the client AND rejected here so the two can never drift.
  static get CUSTOMER_CANCELLABLE_STATES() {
    return ['pending', 'confirmed', 'paid'];
  }

  async cancelOrder(orderId, userId, options = {}) {
    const { reason, detail } = options;

    const order = await Order.findById(orderId);
    if (!order) {
      throw new ErrorHandler('Order not found', 404);
    }

    if (order.user.toString() !== userId.toString()) {
      throw new ErrorHandler('You are not authorized to cancel this order', 403);
    }

    if (order.orderStatus === 'cancelled') {
      throw new ErrorHandler('This order has already been cancelled', 400, 'ALREADY_CANCELLED');
    }

    if (!OrderService.CUSTOMER_CANCELLABLE_STATES.includes(order.orderStatus)) {
      throw new ErrorHandler(
        `This order can no longer be cancelled once it has reached the ${order.orderStatus.replace(/_/g, ' ')} stage.`,
        400,
        'CANCELLATION_NOT_ALLOWED',
      );
    }

    // Restore stock for real catalogue products (synthetic showcase ids no-op).
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    const now = new Date();
    const wasPaid = order.paymentInfo?.status === 'paid';

    order.orderStatus = 'cancelled';
    order.cancellation = {
      reason: reason || 'Not specified',
      detail: detail || '',
      cancelledAt: now,
      cancelledBy: 'customer',
    };

    // Auto-refund: only for paid orders with a captured payment. Never let a
    // refund-API failure block the cancellation itself — flag it for manual
    // follow-up instead.
    if (wasPaid && order.paymentInfo?.razorpay_payment_id) {
      order.refund = {
        required: true,
        status: 'processing',
        amount: order.totalPrice,
        initiatedAt: now,
      };
      try {
        const refund = await paymentService.refundPayment(
          order.paymentInfo.razorpay_payment_id,
          order.totalPrice,
          { reason: 'customer_cancellation', orderId: String(order._id) },
        );
        order.refund.refundId = refund?.id;
        if (refund?.status === 'processed') {
          order.refund.status = 'completed';
          order.refund.completedAt = now;
          order.paymentInfo.status = 'refunded';
        } else if (refund?.status === 'failed') {
          order.refund.status = 'failed';
        } else {
          order.refund.status = 'processing';
        }
      } catch (refundErr) {
        logger.error(`[ORDER] Refund initiation failed for ${orderId}: ${refundErr.message}`);
        // Money still owed — mark pending so ops can retry from the dashboard.
        order.refund.status = 'pending';
      }
    } else {
      order.refund = { required: false, status: 'not_applicable' };
    }

    // In-band activity log — the order timeline is the audit trail used across
    // every other status transition.
    order.events.push({
      status: 'cancelled',
      message: `Order cancelled by customer${reason ? ` — ${reason}` : ''}`,
      timestamp: now,
    });

    await order.save();

    logger.info(
      `[ORDER] Order Cancelled: ${orderId} by User: ${userId} ` +
        `(refund: ${order.refund?.status}, stock restored)`,
    );

    // Admin + customer emails run out-of-band so a slow SMTP hop never delays
    // the dashboard response, and a mail failure never fails the cancellation.
    setImmediate(() => {
      this.sendCancellationNotifications(order._id).catch((e) =>
        logger.error(`[ORDER] Cancellation notifications failed for ${orderId}: ${e.message}`),
      );
    });

    return order;
  }

  /**
   * Fire the admin notice + customer confirmation emails for a cancelled order.
   * Best-effort: each send is isolated so one failing never blocks the other.
   */
  async sendCancellationNotifications(orderId) {
    const order = await Order.findById(orderId);
    if (!order) return;
    const user = await User.findById(order.user).select('name email');

    const items = order.orderItems || [];
    const productNames = items.map((i) => `${i.name} × ${i.quantity}`).join(', ') || '—';
    const totalQty = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const reasonText = order.cancellation?.detail
      ? `${order.cancellation.reason} — ${order.cancellation.detail}`
      : order.cancellation?.reason;
    const refundRequired = !!order.refund?.required;
    const refundStatusLabel = {
      not_applicable: 'Not applicable',
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
    }[order.refund?.status] || 'Not applicable';
    const shortOrderId = String(order._id).slice(-8).toUpperCase();

    // 1) Notify the team.
    try {
      const adminEmail = process.env.CONTACT_EMAIL || 'admin@solivaguard.com';
      const adminHtml = getOrderCancellationAdminTemplate({
        customerName: user?.name || order.shippingInfo?.fullName || 'Customer',
        customerEmail: user?.email || '—',
        orderId: shortOrderId,
        productName: productNames,
        variant: 'N/A',
        quantity: totalQty,
        orderAmount: order.totalPrice,
        paymentMethod: 'Razorpay',
        paymentStatus: order.paymentInfo?.status || 'pending',
        reason: reasonText,
        refundRequired: refundRequired ? 'Yes' : 'No',
        cancelledAt: order.cancellation?.cancelledAt,
      });
      await enqueueEmail('orderCancellationAdmin', {
        email: adminEmail,
        subject: `Order Cancelled — #${shortOrderId}`,
        html: adminHtml,
      });
    } catch (e) {
      logger.warn(`[ORDER] Admin cancellation email skipped: ${e.message}`);
    }

    // 2) Confirm to the customer.
    try {
      if (user?.email) {
        const customerHtml = getOrderCancellationCustomerTemplate({
          customerName: order.shippingInfo?.fullName || user.name,
          orderId: order._id,
          orderItems: items,
          totalPrice: order.totalPrice,
          reason: reasonText,
          refundRequired,
          refundStatusLabel,
        });
        await enqueueEmail('orderCancellation', {
          email: user.email,
          subject: 'Your Soliva Order Has Been Cancelled',
          html: customerHtml,
        });
      }
    } catch (e) {
      logger.warn(`[ORDER] Customer cancellation email skipped: ${e.message}`);
    }
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
