const { z } = require('zod');

const orderValidator = {
  createOrder: z.object({
    body: z.object({
      shippingInfo: z.object({
        fullName: z.string().min(2, 'Full name is required'),
        phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
        houseNo: z.string().optional(),
        buildingName: z.string().optional(),
        street: z.string().min(1, 'Street is required'),
        landmark: z.string().optional(),
        city: z.string().min(1, 'City is required'),
        state: z.string().min(1, 'State is required'),
        country: z.string().min(1, 'Country is required'),
        pincode: z.string().regex(/^[1-9]\d{5}$/, 'Invalid pincode'),
        addressType: z.enum(['Home', 'Work', 'Other']).optional(),
        // Legacy mirrors (optional) — sent for back-compat with old readers.
        address: z.string().optional(),
        pinCode: z.number().int().optional(),
        phoneNo: z.number().int().optional(),
      }),
      orderItems: z.array(z.object({
        name: z.string().min(1, 'Item name is required'),
        price: z.number().positive('Item price must be positive'),
        quantity: z.number().int().positive('Item quantity must be at least 1'),
        image: z.string().url('Invalid item image URL'),
        // The storefront sells showcase items (e.g. "soliva-sunwrap") that have
        // no catalogue Product document. orderService.createOrder() is built to
        // tolerate non-ObjectId refs and mints a synthetic ObjectId for them, so
        // accept any non-empty product reference here instead of forcing a
        // 24-hex ObjectId (which silently broke checkout for showcase products).
        product: z.string().min(1, 'Product reference is required'),
      })).min(1, 'Order must have at least one item'),
      itemsPrice: z.number().min(0),
      taxPrice: z.number().min(0),
      shippingPrice: z.number().min(0),
      totalPrice: z.number().positive('Total price must be positive'),
    }),
  }),

  verifyPayment: z.object({
    body: z.object({
      razorpay_order_id: z.string().min(1, 'Razorpay Order ID is required'),
      razorpay_payment_id: z.string().min(1, 'Razorpay Payment ID is required'),
      razorpay_signature: z.string().min(1, 'Razorpay Signature is required'),
      orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ID'),
    }),
  }),

  getOrderById: z.object({
    params: z.object({
      id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ID'),
    }),
  }),

  updateStatus: z.object({
    body: z.object({
      status: z.enum(['pending', 'confirmed', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded']),
    }),
    params: z.object({
      id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ID'),
    }),
  }),
};

module.exports = orderValidator;