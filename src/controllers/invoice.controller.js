
const fs = require('fs');
const settingsService = require('../services/settings.service');
const invoiceService = require('../services/invoice.service');
const ApiResponse = require('../utils/ApiResponse');

class InvoiceController {
  async generateInvoice(req, res, next) {
    try {
      const { orderId } = req.params;

      const invoice = await invoiceService.generateInvoice(
        orderId,
        req.user._id,
        'manual'
      );

      res.status(201).json(
        ApiResponse.success('Invoice generated successfully', { invoice })
      );
    } catch (error) {
      next(error);
    }
  }

async getInvoiceByOrder(req, res, next) {
  try {
    const { orderId } = req.params;

    const invoice = await invoiceService.getInvoiceByOrder(
      orderId,
      req.user._id,
      req.user.role
    );

    const settings = await settingsService.getSettings();

    res.status(200).json(
      ApiResponse.success('Invoice fetched successfully', {
        invoice,
        settings: {
          billing: settings.billing || {},
          support: settings.support || {},
          tax: settings.tax || {},
        },
      })
    );
  } catch (error) {
    next(error);
  }
}

  async downloadInvoice(req, res, next) {
    try {
      const { invoiceId } = req.params;

      const invoice = await invoiceService.getInvoiceById(
        invoiceId,
        req.user._id,
        req.user.role
      );

      if (!fs.existsSync(invoice.pdfPath)) {
        return res.status(404).json({
          success: false,
          message: 'Invoice PDF file not found',
        });
      }

      res.download(invoice.pdfPath, `${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InvoiceController();