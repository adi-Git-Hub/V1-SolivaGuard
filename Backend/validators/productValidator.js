const { z } = require('zod');

// Accepts full https:// URLs and relative paths (e.g. /product_images/foo.webp)
const imageUrl = z.string().min(1).refine(
  v => /^https?:\/\//i.test(v) || v.startsWith('/'),
  { message: 'Image URL must be a full URL or a relative path starting with /' }
);

// Public product detail route now accepts EITHER a Mongo ObjectId or a slug.
// We validate "non-empty short string"; the service distinguishes the two.
const idOrSlug = z
  .string()
  .min(1, 'Product identifier is required')
  .max(120, 'Identifier too long');

const productValidator = {
  createProduct: z.object({
    body: z.object({
      name: z.string().min(1, 'Product name is required'),
      slug: z.string().min(1).max(120).optional(),
      description: z.string().min(1, 'Product description is required'),
      price: z.number().positive('Price must be greater than 0'),
      compareAtPrice: z.number().positive().nullable().optional(),
      currency: z.string().length(3).optional(),
      category: z.string().min(1, 'Category is required'),
      tags: z.array(z.string()).optional(),
      featured: z.boolean().optional(),
      status: z.enum(['active', 'draft', 'archived']).optional(),
      stock: z.number().int().min(0, 'Stock cannot be negative'),
      images: z
        .array(z.object({ url: imageUrl }))
        .min(1, 'At least one image is required'),
    }),
  }),

  updateProduct: z.object({
    body: z.object({
      name: z.string().min(1).optional(),
      slug: z.string().min(1).max(120).optional(),
      description: z.string().min(1).optional(),
      price: z.number().positive().optional(),
      compareAtPrice: z.number().positive().nullable().optional(),
      currency: z.string().length(3).optional(),
      category: z.string().min(1).optional(),
      tags: z.array(z.string()).optional(),
      featured: z.boolean().optional(),
      status: z.enum(['active', 'draft', 'archived']).optional(),
      stock: z.number().int().min(0).optional(),
      images: z.array(z.object({ url: imageUrl })).optional(),
    }),
    params: z.object({
      // Admin endpoints still operate on ObjectId only.
      id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID'),
    }),
  }),

  // Public lookup — accepts slug or ObjectId.
  getProductByIdOrSlug: z.object({
    params: z.object({
      idOrSlug,
    }),
  }),

  // Admin lookup (delete) — ObjectId only.
  getProductByIdAdmin: z.object({
    params: z.object({
      id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID'),
    }),
  }),
};

module.exports = productValidator;
