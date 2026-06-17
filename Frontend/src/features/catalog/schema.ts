import { z } from "zod";

// The runtime shape is constructed by the backend adapter (api.ts). We keep
// Zod here for TypeScript inference and an optional safety net; image URLs
// are loosened from .url() because the backend may serve relative paths
// (/uploads/...) before Cloudinary lands.
export const productSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  priceCents: z.number().int().nonnegative(),
  compareAtCents: z.number().int().nonnegative().nullable(),
  currency: z.string().default("INR"),
  images: z.array(z.string()),
  categoryId: z.string(),
  categorySlug: z.string(),
  inStock: z.boolean(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
});
export type Product = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  image: z.string(),
  productCount: z.number().int().nonnegative(),
});
export type Category = z.infer<typeof categorySchema>;

export const productListQuerySchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "rating"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(24),
});
export type ProductListQuery = z.infer<typeof productListQuerySchema>;

export const searchQuerySchema = z.object({
  q: z.string().default(""),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;
