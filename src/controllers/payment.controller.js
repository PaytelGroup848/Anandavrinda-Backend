const mongoose = require('mongoose');
const Order = require('../models/order.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const cashfreeService = require('../services/cashfree.service');
const invoiceService = require('../services/invoice.service');

class PaymentController {
  async createCashfreeOrder(req, res, next) {
    try {
      const { orderId } = req.body;

      if (!orderId) {
        throw new ApiError(400, 'Order ID is required');
      }

      const query = { _id: orderId };

      if (req.user.role !== 'super_admin' && req.user.role !== 'sub_admin') {
        query.user = req.user._id;
      }

      const order = await Order.findOne(query).populate(
        'user',
        'name email phone'
      );

      if (!order) {
        throw new ApiError(404, 'Order not found');
      }

      if (order.payment.status === 'paid') {
        throw new ApiError(400, 'Order is already paid');
      }

      if (Number(order.total) < 1) {
        throw new ApiError(400, 'Order amount must be at least ₹1');
      }

      order.payment.method = 'cashfree';
      await order.save();

      const cashfreeOrder = await cashfreeService.createOrder(order);

      order.payment.cashfreeOrderId = cashfreeOrder.order_id;
      order.payment.cashfreePaymentSessionId =
        cashfreeOrder.payment_session_id;
      order.payment.cashfreeCfOrderId = cashfreeOrder.cf_order_id;
      order.payment.cashfreeRawResponse = cashfreeOrder;

      await order.save();

      res.status(200).json(
        ApiResponse.success('Cashfree order created successfully', {
          order,
          cashfree: {
            orderId: cashfreeOrder.order_id,
            cfOrderId: cashfreeOrder.cf_order_id,
            paymentSessionId: cashfreeOrder.payment_session_id,
            orderStatus: cashfreeOrder.order_status,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async verifyCashfreePayment(req, res, next) {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      throw new ApiError(400, 'Order ID is required');
    }

    const orConditions = [
      { orderId: String(orderId) },
      { 'payment.cashfreeOrderId': String(orderId) },
    ];

    // Agar real MongoDB _id hai tabhi _id query me add karo
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      orConditions.push({ _id: orderId });
    }

    const query = {
      $or: orConditions,
    };

    if (req.user.role !== 'super_admin' && req.user.role !== 'sub_admin') {
      query.user = req.user._id;
    }

    const order = await Order.findOne(query);

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    const cashfreeOrderId = order.payment.cashfreeOrderId || order.orderId;

    const cashfreeOrder = await cashfreeService.getOrder(cashfreeOrderId);

    order.payment.cashfreeRawResponse = cashfreeOrder;

    if (cashfreeOrder.order_status === 'PAID') {
      order.payment.status = 'paid';
      order.payment.method = 'cashfree';
      order.payment.transactionId = String(cashfreeOrder.cf_order_id || '');
      order.payment.paymentId = String(cashfreeOrder.cf_order_id || '');
      order.payment.paidAt = order.payment.paidAt || new Date();

      order.status = 'confirmed';
      order.confirmedAt = order.confirmedAt || new Date();

      order.orderStatusHistory = Array.isArray(order.orderStatusHistory)
        ? order.orderStatusHistory
        : [];

      const alreadyConfirmed = order.orderStatusHistory.some(
        (item) =>
          item.status === 'confirmed' &&
          String(item.message || '').includes('Cashfree')
      );

      if (!alreadyConfirmed) {
        order.orderStatusHistory.push({
          status: 'confirmed',
          message: 'Payment verified via Cashfree.',
          updatedBy: req.user._id,
          createdAt: new Date(),
        });
      }

      await order.save();

      try {
        await invoiceService.generateInvoice(order._id, req.user._id, 'auto');
      } catch (invoiceError) {
        console.error(
          'Invoice generation after Cashfree payment failed:',
          invoiceError.message
        );
      }
    } else if (cashfreeOrder.order_status === 'EXPIRED') {
      order.payment.status = 'failed';
      await order.save();
    } else {
      await order.save();
    }

    res.status(200).json(
      ApiResponse.success('Cashfree payment verified successfully', {
        order,
        cashfree: cashfreeOrder,
      })
    );
  } catch (error) {
    next(error);
  }
}

  async cashfreeWebhook(req, res) {
    try {
      const payload = req.body;
      const cashfreeOrderId =
        payload?.data?.order?.order_id ||
        payload?.data?.order_id ||
        payload?.order_id;

      if (!cashfreeOrderId) {
        return res.status(200).json({ ok: true });
      }

      const order = await Order.findOne({
        $or: [
          { orderId: cashfreeOrderId },
          { 'payment.cashfreeOrderId': cashfreeOrderId },
        ],
      });

      if (!order) {
        return res.status(200).json({ ok: true });
      }

      const cashfreeOrder = await cashfreeService.getOrder(cashfreeOrderId);

      order.payment.cashfreeRawResponse = {
        webhook: payload,
        verifiedOrder: cashfreeOrder,
      };

      if (cashfreeOrder.order_status === 'PAID') {
        order.payment.status = 'paid';
        order.payment.method = 'cashfree';
        order.payment.transactionId = String(cashfreeOrder.cf_order_id || '');
        order.payment.paymentId = String(cashfreeOrder.cf_order_id || '');
        order.payment.paidAt = order.payment.paidAt || new Date();

        order.status = 'confirmed';
        order.confirmedAt = order.confirmedAt || new Date();

        order.orderStatusHistory = Array.isArray(order.orderStatusHistory)
          ? order.orderStatusHistory
          : [];

        order.orderStatusHistory.push({
          status: 'confirmed',
          message: 'Payment confirmed via Cashfree webhook.',
          createdAt: new Date(),
        });

        await order.save();

        try {
          await invoiceService.generateInvoice(order._id, null, 'auto');
        } catch (invoiceError) {
          console.error(
            'Invoice generation from webhook failed:',
            invoiceError.message
          );
        }
      } else {
        await order.save();
      }

      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Cashfree webhook error:', error);
      return res.status(200).json({ ok: true });
    }
  }
}

module.exports = new PaymentController();