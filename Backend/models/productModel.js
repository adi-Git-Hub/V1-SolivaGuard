const mongoose = require('mongoose');

// Lightweight slugify — pre-save hook only; the heavy lifting (collisions,
// renames, history) is intentionally not modelled here. Admins can override
// `slug` explicitly when creating a product.
function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter product name'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      // Not required up-front — the pre-save hook will generate one from `name`
      // if the caller didn't pass an explicit slug.
    },
    description: {
      type: String,
      required: [true, 'Please enter product description'],
    },
    price: {
      type: Number,
      required: [true, 'Please enter product price'],
      default: 0.0,
    },
    // Optional MSRP / "before sale" price. Frontend uses this to render
    // strike-through pricing. Nullable so legacy docs are unaffected.
    compareAtPrice: {
      type: Number,
      default: null,
    },
    // ISO 4217. Defaults to USD to match the current PriceDisplay locale.
    // Change to 'INR' per product (or globally) when the storefront switches.
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      maxlength: 3,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
      },
    ],
    category: {
      type: String,
      required: [true, 'Please enter product category'],
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
      index: true,
    },
    stock: {
      type: Number,
      required: [true, 'Please enter product stock'],
      default: 1,
    },
    ratings: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-generate slug on first save (or whenever name changes and slug is empty).
// We deliberately do NOT auto-rename the slug when the name changes on an
// existing doc — slugs are URLs, and silently rotating them breaks SEO.
productSchema.pre('save', async function () {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
});

// Text index for keyword search. Mongo's $text is faster than regex and
// supports stemming / phrase matching; the existing service still uses regex
// as a fallback (covered in Phase 3 changes to productService.js).
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
