const express = require('express');
const {
  getDashboardStats,
  getAdminProducts,
  getCustomerStats,
  getAdminCustomers,
  getAdminCustomerById,
  updateCustomerStatus,
  exportCustomers,
  bulkDeleteCustomers,
  bulkDeleteOrders,
  getAdminInventory,
  updateAdminInventory,
  getAdminPayments,
  getAdminAnalytics,
} = require('../controllers/adminController');
const {
  getReachAnalytics,
  getVisitorActivity,
  getVisitorDetail,
} = require('../controllers/analyticsController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(isAuthenticatedUser, authorizeRoles('admin'));

router.get('/dashboard',  getDashboardStats);
router.get('/products',   getAdminProducts);
// Static customer routes must precede the parameterised /customers/:id.
router.get('/customers/stats',  getCustomerStats);
router.get('/customers/export', exportCustomers);
router.post('/customers/bulk-delete', bulkDeleteCustomers);
router.get('/customers',  getAdminCustomers);
router.get('/customers/:id', getAdminCustomerById);
router.patch('/customers/:id/status', updateCustomerStatus);
// Order bulk delete lives here (not orderRoutes) to keep every admin-panel-only
// mutation behind this router's single admin guard.
router.post('/orders/bulk-delete', bulkDeleteOrders);
router.get('/inventory',  getAdminInventory);
router.patch('/inventory/:productId', updateAdminInventory);
router.get('/payments',   getAdminPayments);
router.get('/analytics/reach', getReachAnalytics);
router.get('/analytics/visitors', getVisitorActivity);
router.get('/analytics/visitors/:visitorId', getVisitorDetail);
router.get('/analytics',  getAdminAnalytics);

module.exports = router;
