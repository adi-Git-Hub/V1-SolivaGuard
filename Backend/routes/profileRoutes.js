const express = require('express');
const { isAuthenticatedUser } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const profileValidator = require('../validators/profileValidator');
const {
  getProfile,
  updateLifestyle,
  updatePreferences,
  updateNotifications,
  addToWishlist,
  removeFromWishlist,
  getRecentProducts,
  trackProductView,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getTickets,
  getTicketDetails,
  createTicket,
  replyToTicket,
} = require('../controllers/profileController');

const router = express.Router();

router.use(isAuthenticatedUser);

// --- User Profile ---
router.get('/', getProfile);
router.put('/lifestyle', validate(profileValidator.updateLifestyle), updateLifestyle);
router.put('/preferences', validate(profileValidator.updatePreferences), updatePreferences);
router.put('/notifications', validate(profileValidator.updateNotifications), updateNotifications);

// --- Wishlist ---
router.post('/wishlist', validate(profileValidator.addToWishlist), addToWishlist);
router.delete('/wishlist/:productId', validate(profileValidator.removeFromWishlist), removeFromWishlist);

// --- Recently Viewed ---
router.get('/recent', getRecentProducts);
router.post('/recent', validate(profileValidator.trackProductView), trackProductView);

// --- Addresses ---
router.get('/addresses', getAddresses);
router.post('/addresses', validate(profileValidator.addAddress), addAddress);
router.put('/addresses/:id/default', validate(profileValidator.setDefaultAddress), setDefaultAddress);
router.put('/addresses/:id', validate(profileValidator.updateAddress), updateAddress);
router.delete('/addresses/:id', validate(profileValidator.deleteAddress), deleteAddress);

// --- Support Tickets ---
router.get('/tickets', getTickets);
router.get('/tickets/:id', getTicketDetails);
router.post('/tickets', validate(profileValidator.createSupportTicket), createTicket);
router.post('/tickets/:id/reply', validate(profileValidator.replyToTicket), replyToTicket);

module.exports = router;
