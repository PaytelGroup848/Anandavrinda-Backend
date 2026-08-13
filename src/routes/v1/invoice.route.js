const express = require('express');
const router = express.Router();

const invoiceController = require('../../controllers/invoice.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

router.post(
  '/orders/:orderId/generate',
  invoiceController.generateInvoice
);

router.get(
  '/orders/:orderId',
  invoiceController.getInvoiceByOrder
);

router.get(
  '/:invoiceId/download',
  invoiceController.downloadInvoice
);

module.exports = router;