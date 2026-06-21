const express = require('express');
const {
  getDashboardStats,
  getAdminProducts,
  getCustomerStats,
  getAdminCustomers,
  getAdminCustomerById,
  updateCustomerStatus,
  exportCustomers,
  getAdminInventory,
  updateAdminInventory,
  getAdminPayments,
  getAdminAnalytics,
} = require('../controllers/adminController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(isAuthenticatedUser, authorizeRoles('admin'));

router.get('/dashboard',  getDashboardStats);
router.get('/products',   getAdminProducts);
// Static customer routes must precede the parameterised /customers/:id.
router.get('/customers/stats',  getCustomerStats);
router.get('/customers/export', exportCustomers);
router.get('/customers',  getAdminCustomers);
router.get('/customers/:id', getAdminCustomerById);
router.patch('/customers/:id/status', updateCustomerStatus);
router.get('/inventory',  getAdminInventory);
router.patch('/inventory/:productId', updateAdminInventory);
router.get('/payments',   getAdminPayments);
router.get('/analytics',  getAdminAnalytics);

module.exports = router;
