import { z } from "zod";

// Matches the order shape Backend/models/orderModel.js stores in Mongo.
// Numbers are in major currency units (rupees / dollars) on the wire; the
// UI converts to cents per project convention when rendering with the
// existing PriceDisplay component.

export const orderItemSchema = z.object({
  product: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  image: z.string().optional(),
});
export type OrderItem = z.infer<typeof orderItemSchema>;

export const shippingInfoSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string(),
  houseNo: z.string().optional().default(""),
  buildingName: z.string().optional().default(""),
  street: z.string().min(1),
  landmark: z.string().optional().default(""),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  pincode: z.string(),
  addressType: z.string().optional().default("Home"),
  // Legacy mirrors — kept so older orders & existing readers still parse.
  address: z.string().optional(),
  pinCode: z.number().int().optional(),
  phoneNo: z.number().int().optional(),
});
export type ShippingInfo = z.infer<typeof shippingInfoSchema>;

export const paymentInfoSchema = z.object({
  razorpay_order_id: z.string().optional(),
  razorpay_payment_id: z.string().optional(),
  razorpay_signature: z.string().optional(),
  status: z.enum(["pending", "paid", "failed", "refunded"]).default("pending"),
});

export const orderStatusEnum = z.enum([
  "pending",
  "paid",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
]);
export type OrderStatus = z.infer<typeof orderStatusEnum>;

export const orderEventSchema = z.object({
  status: z.string(),
  message: z.string().optional(),
  timestamp: z.string().optional(),
});
export type OrderEvent = z.infer<typeof orderEventSchema>;

// Refund lifecycle, independent of orderStatus (an order can be `cancelled`
// while its money is still `processing`). Drives the refund badge.
export const refundStatusEnum = z.enum([
  "not_applicable",
  "pending",
  "processing",
  "completed",
  "failed",
]);
export type RefundStatus = z.infer<typeof refundStatusEnum>;

export const cancellationSchema = z.object({
  reason: z.string().optional(),
  detail: z.string().optional(),
  cancelledAt: z.string().optional(),
  cancelledBy: z.string().optional(),
});
export type Cancellation = z.infer<typeof cancellationSchema>;

export const refundSchema = z.object({
  required: z.boolean().optional(),
  status: refundStatusEnum.optional(),
  refundId: z.string().optional(),
  amount: z.number().optional(),
  initiatedAt: z.string().optional(),
  completedAt: z.string().optional(),
});
export type Refund = z.infer<typeof refundSchema>;

export const orderSchema = z.object({
  id: z.string(),
  _id: z.string().optional(),
  user: z.string().optional(),
  shippingInfo: shippingInfoSchema,
  orderItems: z.array(orderItemSchema),
  paymentInfo: paymentInfoSchema,
  itemsPrice: z.number(),
  taxPrice: z.number(),
  shippingPrice: z.number(),
  totalPrice: z.number(),
  orderStatus: orderStatusEnum,
  events: z.array(orderEventSchema).optional().default([]),
  cancellation: cancellationSchema.optional(),
  refund: refundSchema.optional(),
  createdAt: z.string().optional(),
  deliveredAt: z.string().optional(),
  // Auto-generated documents
  invoiceNumber: z.string().optional(),
  receiptNumber: z.string().optional(),
  invoiceUrl: z.string().optional(),
  receiptUrl: z.string().optional(),
  documentsGeneratedAt: z.string().optional(),
});
export type Order = z.infer<typeof orderSchema>;

export const createOrderInputSchema = z.object({
  // Guest checkout only — the account a guest order attaches to. Ignored by
  // the backend for an authenticated request.
  guestEmail: z.string().email().optional(),
  shippingInfo: shippingInfoSchema,
  orderItems: z.array(orderItemSchema).min(1),
  itemsPrice: z.number().nonnegative(),
  taxPrice: z.number().nonnegative(),
  shippingPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
});
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
