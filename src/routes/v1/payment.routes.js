const express = require('express');
const router = express.Router();

const paymentController = require('../../controllers/payment.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.post(
  '/cashfree/create-order',
  protect,
  paymentController.createCashfreeOrder
);

router.post(
  '/cashfree/verify',
  protect,
  paymentController.verifyCashfreePayment
);

router.post(
  '/cashfree/webhook',
  paymentController.cashfreeWebhook
);

module.exports = router;