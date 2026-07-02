const express = require('express');
const { razorpayWebhook } = require('../controllers/paymentController');
const paymentService = require('../services/paymentService');

const router = express.Router();

router.post('/webhook', razorpayWebhook);



module.exports = router;
