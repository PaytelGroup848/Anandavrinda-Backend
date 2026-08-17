const Razorpay = require('razorpay');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

class RazorpayService {
  constructor() {
    this.keyId = String(process.env.RAZORPAY_KEY_ID || '').trim();
    this.keySecret = String(process.env.RAZORPAY_KEY_SECRET || '').trim();
    this.webhookSecret = String(process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();

    if (!this.keyId || !this.keySecret) {
      console.warn('Razorpay credentials missing in backend .env. Razorpay payments will not work.');
    }

    this.instance = this.keyId && this.keySecret
      ? new Razorpay({ key_id: this.keyId, key_secret: this.keySecret })
      : null;
  }

  async createOrder(order) {
    if (!this.instance) {
      throw new ApiError(500, 'Razorpay credentials missing in backend .env');
    }

    try {
      const amountInPaise = Math.round(Number(order.total) * 100);

      if (amountInPaise < 100) {
        throw new ApiError(400, 'Order amount must be at least ₹1');
      }

      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: String(order.orderId),
        notes: {
          orderId: String(order._id),
          customerName: order.customerName || 'Customer',
          customerEmail: order.customerEmail || '',
          customerPhone: String(order.customerPhone || ''),
        },
      };

      const razorpayOrder = await this.instance.orders.create(options);
      return razorpayOrder;
    } catch (error) {
      console.error('Razorpay create order error:', error);
      throw new ApiError(
        error.statusCode || 500,
        error.error?.description || error.message || 'Failed to create Razorpay order'
      );
    }
  }

  verifyPaymentSignature(paymentData) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return false;
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === razorpay_signature;
  }

  verifyWebhookSignature(payload, signature, rawBody = null) {
    if (!this.webhookSecret || !signature) {
      return false;
    }

    const bodyToSign = rawBody !== null && rawBody !== undefined
      ? rawBody
      : JSON.stringify(payload);

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(bodyToSign.toString())
      .digest('hex');

    return expectedSignature === signature;
  }

  async fetchPayment(paymentId) {
    if (!this.instance) {
      throw new ApiError(500, 'Razorpay credentials missing in backend .env');
    }

    try {
      const payment = await this.instance.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      console.error('Razorpay fetch payment error:', error);
      throw new ApiError(
        error.statusCode || 500,
        error.error?.description || error.message || 'Failed to fetch Razorpay payment'
      );
    }
  }

  async fetchOrder(orderId) {
    if (!this.instance) {
      throw new ApiError(500, 'Razorpay credentials missing in backend .env');
    }

    try {
      const order = await this.instance.orders.fetch(orderId);
      return order;
    } catch (error) {
      console.error('Razorpay fetch order error:', error);
      throw new ApiError(
        error.statusCode || 500,
        error.error?.description || error.message || 'Failed to fetch Razorpay order'
      );
    }
  }
}

module.exports = new RazorpayService();
