const express = require('express');
const {
  newOrder,
  verifyPayment,
  getSingleOrder,
  myOrders,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { isAuthenticatedUser, attachUserIfPresent, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const orderValidator = require('../validators/orderValidator');

const router = express.Router();

// Order creation & payment verification are the single code path for BOTH a
// signed-in checkout and a guest one: attachUserIfPresent sets req.user when
// a valid session exists and silently continues without one otherwise.
// orderService.createOrder branches on req.user's presence to attach the
// order to that account or to a find-or-create guest account.
router.post('/', attachUserIfPresent, validate(orderValidator.createOrder), newOrder);
router.post('/verify-payment', attachUserIfPresent, validate(orderValidator.verifyPayment), verifyPayment);

// Everything else stays account-only, unchanged from before.
router.get('/me', isAuthenticatedUser, myOrders);
router.get('/:id', isAuthenticatedUser, validate(orderValidator.getOrderById), getSingleOrder);
router.put('/:id/cancel', isAuthenticatedUser, validate(orderValidator.cancelOrder), cancelOrder);

// Admin routes
router.get(
  '/admin/orders',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  getAllOrders
);

router.put(
  '/admin/orders/:id',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  validate(orderValidator.updateStatus),
  updateOrderStatus
);

module.exports = router;