const userProfileService = require('../services/userProfileService');
const recentlyViewedService = require('../services/recentlyViewedService');
const addressService = require('../services/addressService');
const supportTicketService = require('../services/supportTicketService');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const sendResponse = require('../utils/sendResponse');

// --- User Profile ---

exports.getProfile = catchAsyncErrors(async (req, res, next) => {
  const profile = await userProfileService.getProfile(req.user.id);
  return sendResponse(res, { data: { profile } });
});

exports.updateLifestyle = catchAsyncErrors(async (req, res, next) => {
  const profile = await userProfileService.updateLifestyle(req.user.id, req.body.lifestyle);
  return sendResponse(res, { data: { profile } });
});

exports.updatePreferences = catchAsyncErrors(async (req, res, next) => {
  const profile = await userProfileService.updatePreferences(req.user.id, req.body.preferences);
  return sendResponse(res, { data: { profile } });
});

exports.updateNotifications = catchAsyncErrors(async (req, res, next) => {
  const profile = await userProfileService.updateNotifications(req.user.id, req.body.notifications);
  return sendResponse(res, { data: { profile } });
});

// --- Wishlist ---

exports.addToWishlist = catchAsyncErrors(async (req, res, next) => {
  const { productId, wantsRestockAlert } = req.body;
  const profile = await userProfileService.addToWishlist(req.user.id, productId, wantsRestockAlert);
  return sendResponse(res, { data: { profile } });
});

exports.removeFromWishlist = catchAsyncErrors(async (req, res, next) => {
  const profile = await userProfileService.removeFromWishlist(req.user.id, req.params.productId);
  return sendResponse(res, { data: { profile } });
});

// --- Recently Viewed ---

exports.getRecentProducts = catchAsyncErrors(async (req, res, next) => {
  const recent = await recentlyViewedService.getRecentProducts(req.user.id);
  return sendResponse(res, { data: { recent } });
});

exports.trackProductView = catchAsyncErrors(async (req, res, next) => {
  const track = await recentlyViewedService.trackProductView(req.user.id, req.body.productId);
  return sendResponse(res, { data: { track } });
});

// --- Addresses ---

exports.getAddresses = catchAsyncErrors(async (req, res, next) => {
  const addresses = await addressService.getUserAddresses(req.user.id);
  return sendResponse(res, { data: { addresses } });
});

exports.addAddress = catchAsyncErrors(async (req, res, next) => {
  const address = await addressService.addAddress(req.user.id, req.body);
  return sendResponse(res, { statusCode: 201, data: { address } });
});

exports.updateAddress = catchAsyncErrors(async (req, res, next) => {
  const address = await addressService.updateAddress(req.params.id, req.user.id, req.body);
  return sendResponse(res, { data: { address } });
});

exports.deleteAddress = catchAsyncErrors(async (req, res, next) => {
  await addressService.deleteAddress(req.params.id, req.user.id);
  return sendResponse(res, { message: 'Address deleted successfully' });
});

exports.setDefaultAddress = catchAsyncErrors(async (req, res, next) => {
  const address = await addressService.setDefaultAddress(req.params.id, req.user.id);
  return sendResponse(res, { data: { address } });
});

// --- Support Tickets ---

exports.getTickets = catchAsyncErrors(async (req, res, next) => {
  const tickets = await supportTicketService.getUserTickets(req.user.id);
  return sendResponse(res, { data: { tickets } });
});

exports.getTicketDetails = catchAsyncErrors(async (req, res, next) => {
  const ticket = await supportTicketService.getTicketDetails(req.params.id, req.user.id);
  return sendResponse(res, { data: { ticket } });
});

exports.createTicket = catchAsyncErrors(async (req, res, next) => {
  const ticket = await supportTicketService.createTicket(req.user.id, req.body);
  return sendResponse(res, { statusCode: 201, data: { ticket } });
});

exports.replyToTicket = catchAsyncErrors(async (req, res, next) => {
  const ticket = await supportTicketService.replyToTicket(req.params.id, req.user.id, req.body.message);
  return sendResponse(res, { data: { ticket } });
});
