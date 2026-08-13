const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const Invoice = require('../models/Invoice.model');
const Order = require('../models/order.model');
const ApiError = require('../utils/ApiError');
const settingsService = require('./settings.service');

class InvoiceService {
  generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `INV-${year}-${random}`;
  }

  ensureInvoiceFolder() {
    const invoiceFolder = path.join(process.cwd(), 'uploads', 'invoices');

    if (!fs.existsSync(invoiceFolder)) {
      fs.mkdirSync(invoiceFolder, { recursive: true });
    }

    return invoiceFolder;
  }

  formatCurrency(amount = 0) {
    return `Rs. ${Number(amount || 0).toLocaleString('en-IN')}`;
  }

  drawLine(doc, y) {
    doc
      .moveTo(40, y)
      .lineTo(555, y)
      .strokeColor('#e5e7eb')
      .stroke();
  }

async generateInvoice(orderId, generatedBy = null, type = "auto") {
  const order = await Order.findById(orderId)
    .populate("user", "name email phone")
    .populate("items.product", "name slug images")
    .populate("items.variant", "name attributes");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Duplicate invoice avoid
  const existingInvoice = await Invoice.findOne({
    $or: [{ order: order._id }, { orderId: order.orderId }],
  });

  if (existingInvoice) {
    return existingInvoice;
  }

  const invoiceNumber = this.generateInvoiceNumber();

  const invoiceFolder = this.ensureInvoiceFolder();
  const fileName = `${invoiceNumber}.pdf`;

  // Absolute path for creating PDF
  const absolutePdfPath = path.join(invoiceFolder, fileName);

  // Relative path for database/browser use
  const relativePdfPath = path.join("uploads", "invoices", fileName).replace(/\\/g, "/");

  const settings = await settingsService.getSettings();

  // Pehle PDF create karo. Agar PDF fail hua to DB me invoice save nahi hoga.
  await this.createPdf(order, invoiceNumber, absolutePdfPath, settings);

  const invoice = await Invoice.create({
    invoiceNumber,

    order: order._id,
    orderId: order.orderId,
    user: order.user?._id || order.user,

    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,

    subtotal: order.subtotal || 0,
    discountAmount: order.discountAmount || 0,
    shippingCharge: order.shippingCharge || 0,
    taxAmount: order.taxAmount || 0,
    total: order.total || 0,

    paymentMethod: order.payment?.method || "cod",
    paymentStatus: order.payment?.status || "paid",

    pdfPath: relativePdfPath,

    generatedBy: generatedBy || null,
    generatedType: type || "auto",
  });

  return invoice;
}

  async createPdf(order, invoiceNumber, pdfPath, settings = {}) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
      });

      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);


      const billing = settings.billing || {};
      const support = settings.support || {};
      const tax = settings.tax || {};

      const company = {
        name: billing.companyName || process.env.COMPANY_NAME || 'QubanHC',

        email:
          billing.email ||
          support.email ||
          process.env.COMPANY_EMAIL ||
          'support@qubanhc.com',

        phone:
          billing.phone ||
          support.phone ||
          process.env.COMPANY_PHONE ||
          '+91 99999 99999',

        address:
          [
            billing.address,
            billing.city,
            billing.state,
            billing.pincode,
            billing.country,
          ]
            .filter(Boolean)
            .join(', ') ||
          process.env.COMPANY_ADDRESS ||
          'Delhi, India',

        gst:
          billing.gstin ||
          tax.gstNumber ||
          process.env.COMPANY_GST ||
          'N/A',

        pan: billing.pan || 'N/A',
      };


      // Header
      doc
        .fontSize(24)
        .fillColor('#0f766e')
        .text(company.name, 40, 35);

      doc
        .fontSize(10)
        .fillColor('#6b7280')
        .text(company.address, 40, 65)
        .text(`Email: ${company.email}`, 40, 80)
        .text(`Phone: ${company.phone}`, 40, 95)
        .text(`GST: ${company.gst}`, 40, 110)
        .text(`PAN: ${company.pan}`, 40, 125);

      doc
        .fontSize(22)
        .fillColor('#111827')
        .text('TAX INVOICE', 390, 40, {
          width: 160,
          align: 'right',
        });

      doc
        .fontSize(10)
        .fillColor('#374151')
        .text(`Invoice No: ${invoiceNumber}`, 350, 75, {
          width: 200,
          align: 'right',
        })
        .text(`Order ID: ${order.orderId}`, 350, 92, {
          width: 200,
          align: 'right',
        })
        .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 350, 109, {
          width: 200,
          align: 'right',
        });

      this.drawLine(doc, 150);

      // Customer
      doc
        .fontSize(13)
        .fillColor('#111827')
        .text('Bill To', 40, 160);

      doc
        .fontSize(10)
        .fillColor('#374151')
        .text(order.customerName || '-', 40, 183)
        .text(order.customerEmail || '-', 40, 198)
        .text(order.customerPhone || '-', 40, 213);

      const address = order.shippingAddress || {};

      doc
        .text(
          `${address.addressLine1 || ''} ${address.addressLine2 || ''}`,
          40,
          228,
          { width: 250 }
        )
        .text(
          `${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`,
          40,
          258,
          { width: 250 }
        )
        .text(address.country || 'India', 40, 273);

      // Payment info
      doc
        .fontSize(13)
        .fillColor('#111827')
        .text('Payment Details', 350, 160);

      doc
        .fontSize(10)
        .fillColor('#374151')
        .text(`Method: ${order.payment.method || '-'}`, 350, 183)
        .text(`Status: ${order.payment.status || '-'}`, 350, 198)
        .text(`Transaction: ${order.payment.transactionId || order.payment.paymentId || '-'}`, 350, 213, {
          width: 200,
        });

      this.drawLine(doc, 305);

      // Table header
      let y = 330;

      doc
        .rect(40, y, 515, 28)
        .fill('#f3f4f6');

      doc
        .fontSize(10)
        .fillColor('#111827')
        .text('Item', 50, y + 9, { width: 210 })
        .text('Qty', 280, y + 9, { width: 40, align: 'center' })
        .text('Price', 335, y + 9, { width: 75, align: 'right' })
        .text('Total', 455, y + 9, { width: 90, align: 'right' });

      y += 38;

      // Items
      order.items.forEach((item, index) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        doc
          .fontSize(10)
          .fillColor('#111827')
          .text(`${index + 1}. ${item.name}`, 50, y, { width: 210 });

        if (item.variantName) {
          doc
            .fontSize(8)
            .fillColor('#6b7280')
            .text(`Variant: ${item.variantName}`, 50, y + 14, { width: 210 });
        }

        doc
          .fontSize(10)
          .fillColor('#374151')
          .text(String(item.quantity), 280, y, { width: 40, align: 'center' })
          .text(this.formatCurrency(item.price), 335, y, {
            width: 75,
            align: 'right',
          })
          .text(this.formatCurrency(item.total), 455, y, {
            width: 90,
            align: 'right',
          });

        y += item.variantName ? 40 : 28;

        doc
          .moveTo(40, y - 8)
          .lineTo(555, y - 8)
          .strokeColor('#f3f4f6')
          .stroke();
      });

      if (y > 600) {
        doc.addPage();
        y = 60;
      }

      // Totals
      y += 20;

      const totalX = 350;
      const valueX = 455;

      const totalRow = (label, value, bold = false) => {
        doc
          .fontSize(bold ? 12 : 10)
          .fillColor('#374151')
          .text(label, totalX, y, { width: 90, align: 'right' });

        doc
          .fontSize(bold ? 12 : 10)
          .fillColor(bold ? '#111827' : '#374151')
          .text(this.formatCurrency(value), valueX, y, {
            width: 90,
            align: 'right',
          });

        y += bold ? 24 : 18;
      };

      totalRow('Subtotal', order.subtotal);
      totalRow('Discount', -(order.discountAmount || 0));
      totalRow('Shipping', order.shippingCharge || 0);
      totalRow(`GST (${order.taxRate || 18}%)`, order.taxAmount || 0);

      doc
        .moveTo(totalX, y)
        .lineTo(555, y)
        .strokeColor('#d1d5db')
        .stroke();

      y += 12;
      totalRow('Grand Total', order.total, true);

      // Footer
      doc
        .fontSize(9)
        .fillColor('#6b7280')
        .text(
          'Thank you for shopping with QubanHC. This is a computer-generated invoice.',
          40,
          760,
          {
            align: 'center',
            width: 515,
          }
        );

      doc.end();

      stream.on('finish', () => resolve(pdfPath));
      stream.on('error', reject);
    });
  }
async getInvoiceByOrder(orderId, userId, userRole) {
  const query = { order: orderId };

  if (userRole !== 'super_admin' && userRole !== 'sub_admin') {
    query.user = userId;
  }

  const invoice = await Invoice.findOne(query)
    .populate({
      path: 'order',
      model: Order,
      populate: [
        {
          path: 'user',
          select: 'name email phone',
        },
        {
          path: 'items.product',
          select: 'name sku images price',
        },
        {
          path: 'items.variant',
          select: 'name sku attributes price image',
        },
      ],
    })
    .lean();

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  console.log('POPULATED INVOICE ORDER:', invoice.order);

  return invoice;
}

async getInvoiceById(invoiceId, userId, userRole) {
  const query = { _id: invoiceId };

  if (userRole !== 'super_admin' && userRole !== 'sub_admin') {
    query.user = userId;
  }

  const invoice = await Invoice.findOne(query)
    .populate({
      path: 'order',
      model: Order,
      populate: [
        {
          path: 'user',
          select: 'name email phone',
        },
        {
          path: 'items.product',
          select: 'name sku images price',
        },
        {
          path: 'items.variant',
          select: 'name sku attributes price image',
        },
      ],
    })
    .lean();

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  return invoice;
}
}

module.exports = new InvoiceService();