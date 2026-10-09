const mongoose = require('mongoose');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Address = require('../models/addressModel');
const AuthAuditLog = require('../models/authAuditLogModel');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const sendResponse = require('../utils/sendResponse');
const ErrorHandler = require('../utils/errorHandler');

// ── Customer segmentation tunables ──────────────────────────────────────
// A customer counts as "active" if they placed an order within this window.
const ACTIVE_WINDOW_DAYS = 30;
// Lifetime spend (₹) at or above which a customer is "high value".
const HIGH_VALUE_THRESHOLD = 5000;

// Fields the customer list/detail may sort by → safe mongo paths (no injection).
const CUSTOMER_SORT_FIELDS = {
  createdAt:     'createdAt',
  name:          'name',
  totalSpend:    'totalSpend',
  totalOrders:   'totalOrders',
  lastOrder:     'lastOrder',
  avgOrderValue: 'avgOrderValue',
};

// Base filter for every customer-facing admin view. Accounts that were
// soft-deleted (self-service via authService.deleteAccount, or by an admin
// bulk delete) keep their row so their orders stay attributable, but they are
// anonymized tombstones and must never appear in the admin customer list,
// the summary cards, or the CSV export.
const LIVE_CUSTOMER_MATCH = { role: 'user', status: { $ne: 'deleted' } };

// Sensitive user fields never returned to the admin client.
const CUSTOMER_PRIVATE_FIELDS = {
  password: 0, sessions: 0, emailOTP: 0,
  forgotPasswordOTP: 0, otpExpire: 0, forgotPasswordExpire: 0,
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Aggregation stages that join orders onto a user and derive the per-customer
// metrics (orders, spend, AOV, last order, active/inactive). Shared by the
// list endpoint and the CSV export so both stay perfectly consistent.
function customerMetricStages(activeSince) {
  return [
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'user',
        as: 'orders',
      },
    },
    {
      $addFields: {
        totalOrders: { $size: '$orders' },
        totalSpend:  { $sum: '$orders.totalPrice' },
        lastOrder:   { $max: '$orders.createdAt' },
      },
    },
    {
      $addFields: {
        avgOrderValue: {
          $cond: [{ $gt: ['$totalOrders', 0] }, { $divide: ['$totalSpend', '$totalOrders'] }, 0],
        },
        activity: {
          $cond: [
            { $and: [{ $gt: ['$totalOrders', 0] }, { $gte: ['$lastOrder', activeSince] }] },
            'active',
            'inactive',
          ],
        },
      },
    },
  ];
}

// Translate a segment id into an aggregation $match on the computed fields.
function segmentMatch(segment, activeSince) {
  switch (segment) {
    case 'new':        return { createdAt: { $gte: activeSince } };
    case 'returning':  return { totalOrders: { $gte: 2 } };
    case 'high-value': return { totalSpend: { $gte: HIGH_VALUE_THRESHOLD } };
    case 'inactive':   return { $or: [{ totalOrders: 0 }, { lastOrder: { $lt: activeSince } }] };
    case 'blocked':    return { status: 'blocked' };
    default:           return null; // 'all'
  }
}

// @desc    Get Admin Dashboard Stats
// @route   GET /api/v1/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = catchAsyncErrors(async (req, res, next) => {
  const totalUsers = await User.countDocuments({ role: 'user' });
  const totalOrders = await Order.countDocuments();
  const totalProducts = await Product.countDocuments();

  // Sum revenue in the database instead of pulling every order into memory —
  // the old `Order.find().lean()` loaded the whole collection just to add up a
  // single number, which grows unbounded as orders accumulate.
  const [revenueAgg] = await Order.aggregate([
    { $match: { $expr: { $eq: [{ $toLower: '$paymentInfo.status' }, 'paid'] } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const totalRevenue = revenueAgg ? revenueAgg.total : 0;

  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name email')
    .lean();

  return sendResponse(res, {
    data: {
      stats: {
        totalUsers,
        totalOrders,
        totalProducts,
        totalRevenue,
        recentOrders,
      }
    }
  });
});

// @desc    Get all products (admin — all statuses, no filter)
// @route   GET /api/v1/admin/products
// @access  Private/Admin
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
  const keyword = (req.query.keyword || req.query.q || '').trim();
  const status = req.query.status || '';
  const category = req.query.category || '';

  const filter = {};
  if (keyword) {
    const safe = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { category: { $regex: safe, $options: 'i' } },
    ];
  }
  if (status && ['active', 'draft', 'archived'].includes(status)) {
    filter.status = status;
  }
  if (category) {
    filter.category = String(category).toLowerCase();
  }

  const page  = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip  = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  return sendResponse(res, {
    data: { products, total, page, limit },
  });
});

// @desc    Customer analytics summary cards (admin)
// @route   GET /api/v1/admin/customers/stats
// @access  Private/Admin
exports.getCustomerStats = catchAsyncErrors(async (req, res, next) => {
  const activeSince = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [totalCustomers, blockedCustomers, activeAgg, returningAgg, revenueAgg, highValueAgg] =
    await Promise.all([
      User.countDocuments(LIVE_CUSTOMER_MATCH),
      User.countDocuments({ ...LIVE_CUSTOMER_MATCH, status: 'blocked' }),
      // Active = distinct customers who ordered within the active window.
      Order.aggregate([
        { $match: { createdAt: { $gte: activeSince } } },
        { $group: { _id: '$user' } },
        { $count: 'count' },
      ]),
      // Returning = customers with 2+ orders.
      Order.aggregate([
        { $group: { _id: '$user', c: { $sum: 1 } } },
        { $match: { c: { $gte: 2 } } },
        { $count: 'count' },
      ]),
      // Revenue = sum of paid orders.
      Order.aggregate([
        { $match: { 'paymentInfo.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      // High value = customers whose lifetime spend clears the threshold.
      Order.aggregate([
        { $group: { _id: '$user', spend: { $sum: '$totalPrice' } } },
        { $match: { spend: { $gte: HIGH_VALUE_THRESHOLD } } },
        { $count: 'count' },
      ]),
    ]);

  return sendResponse(res, {
    data: {
      stats: {
        totalCustomers,
        activeCustomers:    activeAgg[0]?.count    || 0,
        returningCustomers: returningAgg[0]?.count || 0,
        customerRevenue:    revenueAgg[0]?.total   || 0,
        highValueCustomers: highValueAgg[0]?.count || 0,
        blockedCustomers,
      },
    },
  });
});

// @desc    Get all customers (admin) — segmented, sortable, server-paginated
// @route   GET /api/v1/admin/customers
// @access  Private/Admin
exports.getAdminCustomers = catchAsyncErrors(async (req, res, next) => {
  const keyword  = (req.query.keyword || '').trim();
  const status   = req.query.status || '';            // 'active' | 'blocked'
  const segment  = req.query.segment || 'all';        // all|new|returning|high-value|inactive|blocked
  const sortKey  = CUSTOMER_SORT_FIELDS[req.query.sort] || 'createdAt';
  const sortDir  = req.query.dir === 'asc' ? 1 : -1;
  const page     = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit    = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip     = (page - 1) * limit;
  const activeSince = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  // Base match — fields available directly on the user document.
  const baseMatch = { ...LIVE_CUSTOMER_MATCH };
  if (keyword) {
    const safe = escapeRegex(keyword);
    baseMatch.$or = [
      { name:        { $regex: safe, $options: 'i' } },
      { email:       { $regex: safe, $options: 'i' } },
      { phoneNumber: { $regex: safe, $options: 'i' } },
    ];
  }
  if (status === 'active' || status === 'blocked') baseMatch.status = status;
  if (req.query.joinedFrom || req.query.joinedTo) {
    baseMatch.createdAt = {};
    if (req.query.joinedFrom) baseMatch.createdAt.$gte = new Date(req.query.joinedFrom);
    if (req.query.joinedTo)   baseMatch.createdAt.$lte = new Date(req.query.joinedTo);
  }

  const segMatch = segmentMatch(segment, activeSince);

  const pipeline = [
    { $match: baseMatch },
    ...customerMetricStages(activeSince),
    ...(segMatch ? [{ $match: segMatch }] : []),
    { $project: { ...CUSTOMER_PRIVATE_FIELDS, orders: 0 } },
    {
      $facet: {
        data: [
          { $sort: { [sortKey]: sortDir, _id: 1 } },
          { $skip: skip },
          { $limit: limit },
        ],
        meta: [{ $count: 'total' }],
      },
    },
  ];

  // Collation makes the name sort case-insensitive (luxury lists feel wrong
  // when "alice" sorts after "Zoe").
  const [result] = await User.aggregate(pipeline).collation({ locale: 'en', strength: 2 });
  const customers = result?.data ?? [];
  const total     = result?.meta?.[0]?.total ?? 0;

  return sendResponse(res, {
    data: { customers, total, page, limit },
  });
});

// @desc    Get single customer (admin) — profile, analytics, addresses, orders
// @route   GET /api/v1/admin/customers/:id
// @access  Private/Admin
exports.getAdminCustomerById = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('-password -sessions -emailOTP -forgotPasswordOTP -otpExpire -forgotPasswordExpire')
    .lean();
  if (!user) throw new ErrorHandler('Customer not found', 404);

  const [orders, addresses] = await Promise.all([
    Order.find({ user: req.params.id }).sort({ createdAt: -1 }).lean(),
    Address.find({ user: req.params.id }).sort({ isDefault: -1, createdAt: -1 }).lean(),
  ]);

  const totalOrders   = orders.length;
  const totalSpend    = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const paidOrders    = orders.filter(o => o.paymentInfo?.status === 'paid');
  const lifetimeValue = paidOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0;
  const lastOrder     = orders[0]?.createdAt ?? null;

  return sendResponse(res, {
    data: {
      customer: { ...user, totalOrders, totalSpend, lastOrder, avgOrderValue, lifetimeValue },
      addresses,
      orders,
    },
  });
});

// @desc    Block / unblock a customer (admin)
// @route   PATCH /api/v1/admin/customers/:id/status
// @access  Private/Admin
exports.updateCustomerStatus = catchAsyncErrors(async (req, res, next) => {
  const { status } = req.body;
  if (!['active', 'blocked'].includes(status)) {
    throw new ErrorHandler("status must be 'active' or 'blocked'", 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ErrorHandler('Customer not found', 404);
  if (user.role === 'admin') throw new ErrorHandler('Cannot change the status of an admin account', 403);

  user.status = status;
  // Blocking revokes every active session so the customer is logged out at once.
  if (status === 'blocked') user.sessions = [];
  await user.save({ validateBeforeSave: false });

  return sendResponse(res, {
    message: status === 'blocked' ? 'Customer blocked' : 'Customer unblocked',
    data: { id: user._id, status: user.status },
  });
});

// @desc    Export customers as CSV (admin)
// @route   GET /api/v1/admin/customers/export
// @access  Private/Admin
exports.exportCustomers = catchAsyncErrors(async (req, res, next) => {
  const activeSince = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const rows = await User.aggregate([
    { $match: LIVE_CUSTOMER_MATCH },
    ...customerMetricStages(activeSince),
    { $sort: { createdAt: -1 } },
    {
      $project: {
        name: 1, email: 1, phoneNumber: 1, status: 1,
        totalOrders: 1, totalSpend: 1, avgOrderValue: 1,
        lastOrder: 1, createdAt: 1, activity: 1,
      },
    },
  ]);

  const csvCell = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const iso = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

  const header = [
    'Name', 'Email', 'Phone', 'Status', 'Activity',
    'Orders', 'Total Spend', 'Avg Order Value', 'Last Order', 'Joined',
  ];
  const lines = rows.map(r => [
    r.name, r.email, r.phoneNumber || '', r.status || 'active', r.activity || 'inactive',
    r.totalOrders || 0, Math.round(r.totalSpend || 0), Math.round(r.avgOrderValue || 0),
    iso(r.lastOrder), iso(r.createdAt),
  ].map(csvCell).join(','));

  const csv = [header.join(','), ...lines].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="soliva-customers-${iso(new Date())}.csv"`);
  return res.status(200).send(csv);
});

/* ── Bulk delete ────────────────────────────────────────────────────────
   Multi-select delete for the admin customer and order lists. Both endpoints
   are deliberately partial-success: every id is judged on its own and the
   response reports exactly what was removed and what was refused (and why),
   so one protected record never fails the whole batch silently.          */

// Hard cap per request — a runaway or replayed client can never wipe a table
// in a single call, and the per-id loop stays bounded.
const BULK_DELETE_MAX = 100;

// An order in one of these states has ALREADY had its stock returned to the
// catalogue (orderService does that on the cancel/refund transition). Deleting
// one must NOT restock again or inventory silently inflates.
const STOCK_ALREADY_RELEASED = ['cancelled', 'refunded'];

// Validate an { ids: [...] } payload into a unique list of ObjectId strings.
function parseBulkIds(body) {
  const raw = Array.isArray(body?.ids) ? body.ids : null;
  if (!raw || raw.length === 0) {
    throw new ErrorHandler('Provide an "ids" array containing at least one id', 400);
  }
  if (raw.length > BULK_DELETE_MAX) {
    throw new ErrorHandler(`Cannot delete more than ${BULK_DELETE_MAX} records in one request`, 400);
  }
  const ids = [...new Set(raw.map(String))];
  const invalid = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalid.length) {
    throw new ErrorHandler(`Invalid id(s): ${invalid.join(', ')}`, 400);
  }
  return ids;
}

// Scrub every piece of personal data off a user in place, leaving an
// anonymized tombstone. Mirrors authService.deleteAccount so a customer
// deleted by an admin ends up in exactly the same shape as one who deleted
// their own account — the row survives purely so their orders and invoices
// remain attributable and auditable.
function anonymizeCustomer(user) {
  const idStr = String(user._id);
  user.status = 'deleted';
  user.deletedAt = new Date();
  user.name = 'Deleted User';
  // email/username are required + unique → per-id sentinel that still passes
  // the model's email regex. phone/googleId are sparse-unique → unset.
  user.email = `deleted.${idStr}@deleted.co`;
  user.username = `deleted_${idStr}`;
  user.phoneNumber = undefined;
  user.googleId = undefined;
  user.avatarUrl = null;
  user.isVerified = false;
  user.sessions = [];
  user.emailOTP = undefined;
  user.otpExpire = undefined;
  user.forgotPasswordOTP = undefined;
  user.forgotPasswordExpire = undefined;
  user.lastLoginIP = null;
  user.lastLoginISP = null;
  user.lastLoginCity = null;
  user.lastLoginState = null;
  user.lastLoginCountry = null;
  user.lastLatitude = null;
  user.lastLongitude = null;
  user.areaName = null;
  user.subLocality = null;
  user.locality = null;
  user.deviceInfo = null;
  user.browserInfo = null;
  user.osInfo = null;
}

// @desc    Bulk delete customers (admin) — soft delete + anonymize
// @route   POST /api/v1/admin/customers/bulk-delete
// @access  Private/Admin
exports.bulkDeleteCustomers = catchAsyncErrors(async (req, res, next) => {
  const ids = parseBulkIds(req.body);
  const requesterId = String(req.user._id);

  const users = await User.find({ _id: { $in: ids } });
  const byId = new Map(users.map((u) => [String(u._id), u]));

  const deleted = [];
  const skipped = [];

  for (const id of ids) {
    const user = byId.get(id);
    if (!user) {
      skipped.push({ id, reason: 'Customer not found' });
      continue;
    }
    if (user.role === 'admin') {
      skipped.push({ id, name: user.name, reason: 'Admin accounts cannot be deleted' });
      continue;
    }
    if (id === requesterId) {
      skipped.push({ id, name: user.name, reason: 'You cannot delete your own account' });
      continue;
    }
    if (user.status === 'deleted') {
      skipped.push({ id, name: user.name, reason: 'Already deleted' });
      continue;
    }

    const label = user.name;
    anonymizeCustomer(user);
    await user.save({ validateBeforeSave: false });

    // Their saved addresses are pure PII with no accounting value — unlike
    // orders, nothing references them once the account is gone.
    await Address.deleteMany({ user: user._id });

    await AuthAuditLog.create({
      userId: user._id,
      action: 'account_deleted',
      status: 'success',
      message: `Deleted by admin ${requesterId} via admin panel bulk delete`,
    });

    deleted.push({ id, name: label });
  }

  return sendResponse(res, {
    message:
      deleted.length === 0
        ? 'No customers were deleted'
        : `${deleted.length} customer${deleted.length === 1 ? '' : 's'} deleted`,
    data: { deletedCount: deleted.length, deleted, skipped },
  });
});

// @desc    Bulk delete orders (admin) — permanent, money-bearing orders refused
// @route   POST /api/v1/admin/orders/bulk-delete
// @access  Private/Admin
exports.bulkDeleteOrders = catchAsyncErrors(async (req, res, next) => {
  const ids = parseBulkIds(req.body);

  const orders = await Order.find({ _id: { $in: ids } });
  const byId = new Map(orders.map((o) => [String(o._id), o]));

  const deleted = [];
  const skipped = [];
  let restockedItems = 0;

  for (const id of ids) {
    const order = byId.get(id);
    const ref = `#${id.slice(-8).toUpperCase()}`;

    if (!order) {
      skipped.push({ id, ref, reason: 'Order not found' });
      continue;
    }
    // ── Money guards. An order that took a rupee, or that produced a tax
    // document, is a financial record we are required to retain. ──────────
    if (order.paymentInfo?.status === 'paid') {
      skipped.push({ id, ref, reason: 'Payment was captured — financial record must be retained' });
      continue;
    }
    if (Order.PAID_IMPLYING_STATUSES.includes(order.orderStatus)) {
      skipped.push({ id, ref, reason: `Status "${order.orderStatus}" implies payment was taken` });
      continue;
    }
    if (order.invoiceNumber || order.invoiceUrl || order.receiptNumber || order.receiptUrl) {
      skipped.push({ id, ref, reason: 'An invoice/receipt was issued for this order' });
      continue;
    }
    if (order.refund?.status && order.refund.status !== 'not_applicable') {
      skipped.push({ id, ref, reason: `Refund is "${order.refund.status}"` });
      continue;
    }

    // Still-open orders are holding catalogue stock that was decremented at
    // creation. Give it back before the row disappears, or the units are lost.
    if (!STOCK_ALREADY_RELEASED.includes(order.orderStatus)) {
      for (const item of order.orderItems) {
        if (!item.product) continue; // synthetic/showcase ref — nothing to restock
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        restockedItems += item.quantity;
      }
    }

    await order.deleteOne();
    deleted.push({ id, ref });
  }

  return sendResponse(res, {
    message:
      deleted.length === 0
        ? 'No orders were deleted'
        : `${deleted.length} order${deleted.length === 1 ? '' : 's'} deleted` +
          (restockedItems > 0 ? ` · ${restockedItems} unit(s) returned to stock` : ''),
    data: { deletedCount: deleted.length, restockedItems, deleted, skipped },
  });
});

// @desc    Get inventory (admin) — products with stock info
// @route   GET /api/v1/admin/inventory
// @access  Private/Admin
exports.getAdminInventory = catchAsyncErrors(async (req, res, next) => {
  const keyword = (req.query.keyword || '').trim();
  const stockFilter = req.query.stock || ''; // 'low' | 'out'

  const filter = {};
  if (keyword) {
    const safe = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.name = { $regex: safe, $options: 'i' };
  }
  if (stockFilter === 'out') {
    filter.stock = { $lte: 0 };
  } else if (stockFilter === 'low') {
    filter.stock = { $gt: 0, $lte: 5 };
  }

  const products = await Product.find(filter).sort({ stock: 1 }).lean();

  const totalInventory  = products.reduce((s, p) => s + (p.stock || 0), 0);
  const inventoryValue  = products.reduce((s, p) => s + (p.stock || 0) * (p.price || 0), 0);
  const outOfStock      = products.filter(p => (p.stock || 0) <= 0).length;
  const lowStock        = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length;

  return sendResponse(res, {
    data: {
      products,
      summary: { totalInventory, inventoryValue, outOfStock, lowStock },
    },
  });
});

// @desc    Adjust stock for a product (admin)
// @route   PATCH /api/v1/admin/inventory/:productId
// @access  Private/Admin
exports.updateAdminInventory = catchAsyncErrors(async (req, res, next) => {
  const { adjustment, reason } = req.body;
  if (adjustment === undefined || adjustment === null) {
    throw new ErrorHandler('adjustment is required', 400);
  }

  const product = await Product.findById(req.params.productId);
  if (!product) throw new ErrorHandler('Product not found', 404);

  const newStock = Math.max(0, (product.stock || 0) + Number(adjustment));
  product.stock = newStock;
  await product.save({ validateBeforeSave: false });

  return sendResponse(res, {
    data: { product, newStock, reason },
  });
});

// @desc    Get all payments (extracted from orders) — admin
// @route   GET /api/v1/admin/payments
// @access  Private/Admin
exports.getAdminPayments = catchAsyncErrors(async (req, res, next) => {
  const statusFilter = req.query.status || '';
  const keyword = (req.query.keyword || '').trim();

  const filter = {};
  if (statusFilter && ['paid', 'pending', 'failed', 'refunded'].includes(statusFilter)) {
    filter['paymentInfo.status'] = statusFilter;
  }
  if (keyword) {
    const safe = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { 'paymentInfo.razorpay_payment_id': { $regex: safe, $options: 'i' } },
      { 'paymentInfo.razorpay_order_id': { $regex: safe, $options: 'i' } },
    ];
  }

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .populate('user', 'name email')
    .lean();

  const payments = orders.map(o => ({
    _id: o._id,
    orderId: o._id,
    orderStatus: o.orderStatus,
    amount: o.totalPrice,
    paymentInfo: o.paymentInfo,
    user: o.user,
    createdAt: o.createdAt,
    invoiceNumber: o.invoiceNumber,
    receiptUrl: o.receiptUrl,
  }));

  const totalPaid    = payments.filter(p => p.paymentInfo?.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.paymentInfo?.status === 'pending').length;
  const totalFailed  = payments.filter(p => p.paymentInfo?.status === 'failed').length;

  return sendResponse(res, {
    data: { payments, summary: { totalPaid, totalPending, totalFailed } },
  });
});

// @desc    Get analytics data — admin
// @route   GET /api/v1/admin/analytics
// @access  Private/Admin
exports.getAdminAnalytics = catchAsyncErrors(async (req, res, next) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek  = new Date(startOfToday); startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear  = new Date(now.getFullYear(), 0, 1);

  // All orders for computations
  const allOrders = await Order.find().sort({ createdAt: 1 }).lean();
  const paidOrders = allOrders.filter(o => o.paymentInfo?.status === 'paid');

  const revenueToday  = paidOrders.filter(o => new Date(o.createdAt) >= startOfToday).reduce((s, o) => s + o.totalPrice, 0);
  const revenueWeek   = paidOrders.filter(o => new Date(o.createdAt) >= startOfWeek).reduce((s, o) => s + o.totalPrice, 0);
  const revenueMonth  = paidOrders.filter(o => new Date(o.createdAt) >= startOfMonth).reduce((s, o) => s + o.totalPrice, 0);
  const revenueYear   = paidOrders.filter(o => new Date(o.createdAt) >= startOfYear).reduce((s, o) => s + o.totalPrice, 0);

  const ordersToday   = allOrders.filter(o => new Date(o.createdAt) >= startOfToday).length;
  const ordersMonth   = allOrders.filter(o => new Date(o.createdAt) >= startOfMonth).length;

  const avgOrderValue = paidOrders.length > 0 ? paidOrders.reduce((s, o) => s + o.totalPrice, 0) / paidOrders.length : 0;

  // Revenue trend — last 30 days bucketed by day
  const last30Days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - i);
    const nextD = new Date(d); nextD.setDate(nextD.getDate() + 1);
    const dayOrders = paidOrders.filter(o => {
      const t = new Date(o.createdAt);
      return t >= d && t < nextD;
    });
    last30Days.push({
      date: d.toISOString().slice(0, 10),
      revenue: dayOrders.reduce((s, o) => s + o.totalPrice, 0),
      orders: allOrders.filter(o => {
        const t = new Date(o.createdAt);
        return t >= d && t < nextD;
      }).length,
    });
  }

  // Product sales
  const productSales = {};
  allOrders.forEach(o => {
    (o.orderItems || []).forEach(item => {
      const id = String(item.product || item.name);
      if (!productSales[id]) productSales[id] = { name: item.name, units: 0, revenue: 0 };
      productSales[id].units   += item.quantity;
      productSales[id].revenue += item.price * item.quantity;
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Customer growth — unique customers per month (last 12 months)
  const customerGrowth = [];
  for (let i = 11; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd   = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const users = await User.countDocuments({ role: 'user', createdAt: { $gte: mStart, $lt: mEnd } });
    customerGrowth.push({
      month: mStart.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
      customers: users,
    });
  }

  // Order status breakdown
  const statusBreakdown = {};
  allOrders.forEach(o => {
    statusBreakdown[o.orderStatus] = (statusBreakdown[o.orderStatus] || 0) + 1;
  });

  return sendResponse(res, {
    data: {
      summary: { revenueToday, revenueWeek, revenueMonth, revenueYear, ordersToday, ordersMonth, avgOrderValue },
      revenueTrend: last30Days,
      topProducts,
      customerGrowth,
      statusBreakdown,
    },
  });
});
