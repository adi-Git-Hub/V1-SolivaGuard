const mongoose = require('mongoose');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');

const ALLOWED_SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  rating: { ratings: -1 },
  featured: { featured: -1, createdAt: -1 },
};

const MAX_LIMIT = 60;
const DEFAULT_LIMIT = 24;

class ProductService {
  async getProducts(rawQuery = {}) {
    const filter = { status: 'active' };

    // ── Keyword search ──────────────────────────────────────────────────
    // The model has a $text index, but regex is more forgiving (substring,
    // typos at the start of a word). We use regex for now and keep the text
    // index in place for future migrations.
    const keyword = (rawQuery.keyword || rawQuery.q || '').trim();
    if (keyword) {
      const safe = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
        { tags: { $regex: safe, $options: 'i' } },
      ];
    }

    if (rawQuery.category) {
      filter.category = String(rawQuery.category).toLowerCase();
    }

    if (rawQuery.featured === 'true' || rawQuery.featured === true) {
      filter.featured = true;
    }

    // Price filter — values arrive as strings from URL query params.
    if (rawQuery.minPrice != null || rawQuery.maxPrice != null) {
      filter.price = {};
      if (rawQuery.minPrice != null) {
        const v = Number(rawQuery.minPrice);
        if (!Number.isNaN(v)) filter.price.$gte = v;
      }
      if (rawQuery.maxPrice != null) {
        const v = Number(rawQuery.maxPrice);
        if (!Number.isNaN(v)) filter.price.$lte = v;
      }
      // If neither parsed, drop the empty $-object to avoid Mongo errors.
      if (Object.keys(filter.price).length === 0) delete filter.price;
    }

    // ── Sort ───────────────────────────────────────────────────────────
    const sort = ALLOWED_SORTS[rawQuery.sort] || ALLOWED_SORTS.newest;

    // ── Pagination ─────────────────────────────────────────────────────
    const limit = Math.min(
      Math.max(parseInt(rawQuery.limit, 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );
    const page = Math.max(parseInt(rawQuery.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    return { products, total, page, limit };
  }

  /**
   * Lookup by either Mongo ObjectId or human-readable slug. Routes pass the
   * URL param verbatim; we sniff the shape to decide.
   */
  async getSingleProduct(idOrSlug) {
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };
    const product = await Product.findOne(query).lean();
    if (!product) {
      throw new ErrorHandler('Product not found', 404);
    }
    return product;
  }

  async createProduct(data, userId) {
    data.user = userId;
    if (data.price != null)          data.price          = Math.round(data.price);
    if (data.compareAtPrice != null) data.compareAtPrice = Math.round(data.compareAtPrice);
    const product = await Product.create(data);
    logger.info(`[ADMIN] Product Created: ${product.name} (ID: ${product._id}) by Admin: ${userId}`);
    return product;
  }

  async updateProduct(id, data) {
    let product = await Product.findById(id);
    if (!product) {
      throw new ErrorHandler('Product not found', 404);
    }

    if (data.price != null)          data.price          = Math.round(data.price);
    if (data.compareAtPrice != null) data.compareAtPrice = Math.round(data.compareAtPrice);

    product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    logger.info(`[ADMIN] Product Updated: ${product.name} (ID: ${id})`);
    return product;
  }

  async deleteProduct(id) {
    const product = await Product.findById(id);
    if (!product) {
      throw new ErrorHandler('Product not found', 404);
    }
    const productName = product.name;
    await product.deleteOne();
    logger.info(`[ADMIN] Product Deleted: ${productName} (ID: ${id})`);
    return true;
  }

  /**
   * Distinct categories with item counts. Used by /api/v1/categories.
   */
  async getCategoriesWithCounts() {
    const rows = await Product.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$category',
          productCount: { $sum: 1 },
          // pick any product image as a representative thumbnail
          sampleImage: { $first: { $arrayElemAt: ['$images.url', 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return rows
      .filter((r) => r._id) // skip products with no category
      .map((r) => ({
        slug: String(r._id).toLowerCase(),
        name: String(r._id),
        productCount: r.productCount,
        image: r.sampleImage || null,
      }));
  }
}

module.exports = new ProductService();
