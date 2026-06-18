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
  "delivered",
  "cancelled",
  "refunded",
]);
export type OrderStatus = z.infer<typeof orderStatusEnum>;

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
  createdAt: z.string().optional(),
  deliveredAt: z.string().optional(),
});
export type Order = z.infer<typeof orderSchema>;

export const createOrderInputSchema = z.object({
  shippingInfo: shippingInfoSchema,
  orderItems: z.array(orderItemSchema).min(1),
  itemsPrice: z.number().nonnegative(),
  taxPrice: z.number().nonnegative(),
  shippingPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
});
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
