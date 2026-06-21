const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Address = require('../models/addressModel');
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

  const orders = await Order.find().lean();
  let totalRevenue = 0;
  orders.forEach((order) => {
    if (order.paymentInfo && order.paymentInfo.status && order.paymentInfo.status.toLowerCase() === 'paid') {
      totalRevenue += order.totalPrice;
    }
  });

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
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', status: 'blocked' }),
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
  const baseMatch = { role: 'user' };
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
    { $match: { role: 'user' } },
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
