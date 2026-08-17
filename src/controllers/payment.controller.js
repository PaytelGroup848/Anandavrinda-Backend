const mongoose = require('mongoose');
const Order = require('../models/order.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const razorpayService = require('../services/razorpay.service');
const invoiceService = require('../services/invoice.service');
const orderService = require('../services/order.service');

class PaymentController {
  async createRazorpayOrder(req, res, next) {
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

      order.payment.method = 'razorpay';
      await order.save();

      const razorpayOrder = await razorpayService.createOrder(order);

      order.payment.razorpayOrderId = razorpayOrder.id;
      order.payment.razorpayRawResponse = razorpayOrder;

      await order.save();

      res.status(200).json(
        ApiResponse.success('Razorpay order created successfully', {
          order,
          razorpay: {
            orderId: razorpayOrder.id,
            entity: razorpayOrder.entity,
            amount: razorpayOrder.amount,
            amountPaid: razorpayOrder.amount_paid,
            amountDue: razorpayOrder.amount_due,
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt,
            status: razorpayOrder.status,
            keyId: process.env.RAZORPAY_KEY_ID,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async verifyRazorpayPayment(req, res, next) {
    try {
      const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

      if (!orderId) {
        throw new ApiError(400, 'Order ID is required');
      }

      const orConditions = [
        { orderId: String(orderId) },
        { 'payment.razorpayOrderId': String(orderId) },
      ];

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

      const razorpayOrderId = order.payment.razorpayOrderId || razorpay_order_id;

      let isPaid = false;
      let paymentDetails = {};

      if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
        const isValidSignature = razorpayService.verifyPaymentSignature({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        });

        if (isValidSignature) {
          isPaid = true;
          paymentDetails = {
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
          };
        } else {
          throw new ApiError(400, 'Invalid payment signature');
        }
      } else if (razorpayOrderId) {
        const razorpayOrder = await razorpayService.fetchOrder(razorpayOrderId);
        order.payment.razorpayRawResponse = { ...order.payment.razorpayRawResponse, fetchedOrder: razorpayOrder };

        if (razorpayOrder.status === 'paid' || razorpayOrder.amount_paid === razorpayOrder.amount) {
          isPaid = true;
          paymentDetails.paymentId = razorpayOrder.id;
        }
      }

      if (isPaid) {
        order.payment.status = 'paid';
        order.payment.method = 'razorpay';
        order.payment.transactionId = String(paymentDetails.paymentId || '');
        order.payment.paymentId = String(paymentDetails.paymentId || '');
        order.payment.signature = paymentDetails.signature || order.payment.signature;
        order.payment.paidAt = order.payment.paidAt || new Date();

        order.status = 'confirmed';
        order.confirmedAt = order.confirmedAt || new Date();

        order.orderStatusHistory = Array.isArray(order.orderStatusHistory)
          ? order.orderStatusHistory
          : [];

        const alreadyConfirmed = order.orderStatusHistory.some(
          (item) =>
            item.status === 'confirmed' &&
            String(item.message || '').includes('Razorpay')
        );

        if (!alreadyConfirmed) {
          order.orderStatusHistory.push({
            status: 'confirmed',
            message: 'Payment verified via Razorpay.',
            updatedBy: req.user._id,
            createdAt: new Date(),
          });
        }

        await order.save();

        try {
          await orderService.finalizePaidOrder(order._id);
        } catch (finalizeErr) {
          console.error('Order finalize (stock/cart) after Razorpay verify failed:', finalizeErr.message);
        }

        try {
          await invoiceService.generateInvoice(order._id, req.user._id, 'auto');
        } catch (invoiceError) {
          console.error(
            'Invoice generation after Razorpay payment failed:',
            invoiceError.message
          );
        }
      } else {
        await order.save();
      }

      res.status(200).json(
        ApiResponse.success('Razorpay payment verified successfully', {
          order,
          razorpay: paymentDetails,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async razorpayWebhook(req, res) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const payload = req.body;
      const rawBody = req.rawBody;

      if (!razorpayService.verifyWebhookSignature(payload, signature, rawBody)) {
        return res.status(400).json({ ok: false, error: 'Invalid webhook signature' });
      }

      const event = payload.event;
      const data = payload.payload;

      let razorpayOrderId = null;
      let razorpayPaymentId = null;

      if (event === 'payment.captured' || event === 'payment.authorized') {
        razorpayPaymentId = data?.payment?.entity?.id;
        razorpayOrderId = data?.payment?.entity?.order_id;
      } else if (event === 'order.paid') {
        razorpayOrderId = data?.order?.entity?.id;
        razorpayPaymentId = data?.payment?.entity?.id;
      }

      if (!razorpayOrderId && !razorpayPaymentId) {
        return res.status(200).json({ ok: true });
      }

      const order = await Order.findOne({
        $or: [
          { 'payment.razorpayOrderId': razorpayOrderId },
        ],
      });

      if (!order) {
        return res.status(200).json({ ok: true });
      }

      order.payment.razorpayRawResponse = {
        webhook: payload,
        event,
      };

      if (event === 'payment.captured' || event === 'order.paid') {
        if (order.payment.status !== 'paid') {
          order.payment.status = 'paid';
          order.payment.method = 'razorpay';
          order.payment.transactionId = String(razorpayPaymentId || order.payment.transactionId || '');
          order.payment.paymentId = String(razorpayPaymentId || order.payment.paymentId || '');
          order.payment.paidAt = order.payment.paidAt || new Date();

          order.status = 'confirmed';
          order.confirmedAt = order.confirmedAt || new Date();

          order.orderStatusHistory = Array.isArray(order.orderStatusHistory)
            ? order.orderStatusHistory
            : [];

          const alreadyConfirmed = order.orderStatusHistory.some(
            (item) =>
              item.status === 'confirmed' &&
              String(item.message || '').includes('Razorpay')
          );

          if (!alreadyConfirmed) {
            order.orderStatusHistory.push({
              status: 'confirmed',
              message: 'Payment confirmed via Razorpay webhook.',
              createdAt: new Date(),
            });
          }

          await order.save();

          try {
            await orderService.finalizePaidOrder(order._id);
          } catch (finalizeErr) {
            console.error('Order finalize (stock/cart) from Razorpay webhook failed:', finalizeErr.message);
          }

          try {
            await invoiceService.generateInvoice(order._id, null, 'auto');
          } catch (invoiceError) {
            console.error(
              'Invoice generation from webhook failed:',
              invoiceError.message
            );
          }
        }
      } else if (event === 'payment.failed') {
        order.payment.status = 'failed';
        await order.save();
      } else {
        await order.save();
      }

      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Razorpay webhook error:', error);
      return res.status(200).json({ ok: true });
    }
  }
}

module.exports = new PaymentController();
