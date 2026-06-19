import { z } from "zod";

export const cartLineSchema = z.object({
  productId: z.string(),
  variant: z.string().optional(),
  slug: z.string(),
  name: z.string(),
  image: z.string().url(),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().default("INR"),
  quantity: z.number().int().min(1),
});
export type CartLine = z.infer<typeof cartLineSchema>;

export const cartSchema = z.object({
  lines: z.array(cartLineSchema),
});
export type Cart = z.infer<typeof cartSchema>;
