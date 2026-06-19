const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    // Immutable shipping snapshot — copied at order time so editing a saved
    // address later never mutates historical orders.
    shippingInfo: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      houseNo: { type: String, default: '' },
      buildingName: { type: String, default: '' },
      street: { type: String, required: true },
      landmark: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, required: true },
      addressType: { type: String, default: 'Home' },
      // Legacy fields — retained so historical orders and existing readers
      // (emails, order-confirmed page) keep resolving. Populated on new orders.
      address: { type: String },
      pinCode: { type: Number },
      phoneNo: { type: Number },
    },
    orderItems: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String, required: true },
        product: {
          type: mongoose.Schema.ObjectId,
          ref: 'Product',
          required: true,
        },
      },
    ],
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    paymentInfo: {
      razorpay_order_id: { type: String },
      razorpay_payment_id: { type: String },
      razorpay_signature: { type: String },
      status: { type: String, default: 'pending' },
    },
    itemsPrice: { type: Number, required: true, default: 0.0 },
    taxPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    orderStatus: {
      type: String,
      required: true,
      enum: ['pending', 'confirmed', 'paid', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
      default: 'pending'
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Tracking timeline — events double as the immutable tracking history.
    events: [
      {
        status: { type: String, required: true },
        message: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    deliveredAt: Date,

    // ── Auto-generated documents (Phase 2/7) — permanent references. ──
    invoiceNumber: { type: String },
    receiptNumber: { type: String },
    invoiceUrl: { type: String },
    receiptUrl: { type: String },
    documentsGeneratedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);