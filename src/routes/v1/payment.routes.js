const express = require('express');
const router = express.Router();

const paymentController = require('../../controllers/payment.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.post(
  '/razorpay/create-order',
  protect,
  paymentController.createRazorpayOrder
);

router.post(
  '/razorpay/verify',
  protect,
  paymentController.verifyRazorpayPayment
);

router.post(
  '/razorpay/webhook',
  paymentController.razorpayWebhook
);

module.exports = router;
