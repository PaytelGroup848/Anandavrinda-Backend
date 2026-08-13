const Order = require('../models/order.model');
const Cart = require('../models/Cart.model');
const Invoice = require("../models/Invoice.model");
const invoiceService = require('./invoice.service');
const settingsService = require('./settings.service');
const Product = require('../models/Products.model');
const ProductVariant = require('../models/productvarient.model');
const ApiError = require('../utils/ApiError');

class OrderService {
  generateOrderId() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD${year}${month}${day}${random}`;
  }

  async createOrder(userId, orderData) {
    const {
      shippingAddress,
      billingAddress,
      paymentMethod = 'cod',
      customerNote,
      email,
    } = orderData;

    if (!shippingAddress) {
      throw new ApiError(400, 'Shipping address is required');
    }

    const allowedPaymentMethods = ['cod', 'razorpay', 'stripe','cashfree'];
    if (!allowedPaymentMethods.includes(paymentMethod)) {
      throw new ApiError(400, 'Invalid payment method');
    }

    const cart = await Cart.findOne({ user: userId })
      .populate('items.product')
      .populate('items.variant');

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, 'Cart is empty');
    }



    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const product = item.product;

      if (!product || product.status !== 'active') {
        throw new ApiError(400, 'One or more products are no longer available');
      }

      let price = product.price;
      let originalPrice = product.originalPrice;
      let variantName = null;
      let variantId = null;
      let sku = product.sku || null;
      let image = product.images?.[0]?.url || null;

      if (item.variant) {
        const variant = await ProductVariant.findOne({
          _id: item.variant._id,
          product: product._id,
          isActive: true,
        });

        if (!variant) {
          throw new ApiError(400, `${product.name} variant is no longer available`);
        }

        if (variant.stock < item.quantity) {
          throw new ApiError(
            400,
            `Only ${variant.stock} items available for ${product.name} - ${variant.name}`
          );
        }

        price = variant.price;
        originalPrice = variant.originalPrice;
        variantName = variant.name;
        variantId = variant._id;
        sku = variant.sku || product.sku || null;
        image = variant.image?.url || image;
      } else if (product.trackInventory && product.stock < item.quantity) {
        throw new ApiError(
          400,
          `Only ${product.stock} items available for ${product.name}`
        );
      }

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        variant: variantId,
        name: product.name,
        sku,
        quantity: item.quantity,
        price,
        originalPrice,
        total: itemTotal,
        image,
        variantName,
        vendor: product.vendor || null,
      });
    }

 const couponDiscount = Math.min(cart.appliedCoupon?.discountAmount || 0, subtotal);
const couponCode = cart.appliedCoupon?.code || null;

// Settings admin panel se aa rahi hain
const settings = await settingsService.getSettings();

const orderSettings = settings.order || {};
const taxSettings = settings.tax || {};

const freeShippingAbove = Number(orderSettings.freeShippingAbove ?? 999);
const defaultShippingCharge = Number(orderSettings.defaultShippingCharge ?? 79);
const isCODEnabled = orderSettings.isCODEnabled ?? true;
const codCharge = Number(orderSettings.codCharge ?? 0);

// Agar admin ne COD off kiya hai aur customer COD choose karta hai,
// to order create nahi hoga.
if (paymentMethod === 'cod' && !isCODEnabled) {
  throw new ApiError(400, 'Cash on Delivery is currently disabled');
}

const taxableAmount = Math.max(subtotal - couponDiscount, 0);

// Agar amount freeShippingAbove se zyada/equal hai to shipping 0,
// warna admin settings wali shipping charge lagegi.
const shippingCharge =
  taxableAmount >= freeShippingAbove ? 0 : defaultShippingCharge;

// COD selected hai to COD extra charge add hoga.
const codExtraCharge = paymentMethod === 'cod' ? codCharge : 0;

// Agar GST enabled hai to admin settings wala GST rate lagega,
// warna tax 0 rahega.
const taxRate = taxSettings.isGSTEnabled
  ? Number(taxSettings.defaultGSTRate ?? 18)
  : 0;

const taxAmount = Math.round((taxableAmount * taxRate) / 100);

const total = taxableAmount + shippingCharge + codExtraCharge + taxAmount;

    const order = await Order.create({
      orderId: this.generateOrderId(),
      user: userId,
      customerName: shippingAddress.fullName,
      customerEmail: email || shippingAddress.email || '',
      customerPhone: shippingAddress.phone,
      items: orderItems,
      subtotal,
      discountAmount: couponDiscount,
      couponCode,
      couponDiscount,
      shippingCharge,
      taxAmount,
      taxRate,
      total,
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'cod' ? 'pending' : 'pending',
      },
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      customerNote: customerNote || null,
      orderedAt: new Date(),
      orderStatusHistory: [
        {
          status: 'pending',
          message: 'Order placed successfully',
          createdAt: new Date(),
        },
      ],
    });

    for (const item of orderItems) {
      if (item.variant) {
        await ProductVariant.findByIdAndUpdate(item.variant, {
          $inc: { stock: -item.quantity },
        });
      } else {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity, totalSold: item.quantity },
        });
      }
    }

    cart.items = [];
    cart.appliedCoupon = {
      couponId: null,
      code: null,
      discountAmount: 0,
    };
    cart.lastActivityAt = new Date();
    await cart.save();

    return order;
  }

  async getOrderById(orderId, userId, userRole) {
    const query = { _id: orderId };

    if (userRole !== 'super_admin' && userRole !== 'sub_admin') {
      query.user = userId;
    }

    const order = await Order.findOne(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name slug images')
      .populate('items.variant', 'name attributes');

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    return order;
  }

  async getOrderByOrderId(orderIdStr, userId, userRole) {
    const query = { orderId: orderIdStr };

    if (userRole !== 'super_admin' && userRole !== 'sub_admin') {
      query.user = userId;
    }

    const order = await Order.findOne(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name slug images');

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    return order;
  }

  async getUserOrders(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments({ user: userId }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getAllOrders(page = 1, limit = 20, filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email')
        .populate('items.product', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }


  async updateOrderStatus(orderId, status, adminId = null, note = "") {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const previousStatus = order.status;

  order.status = status;

  order.statusHistory = Array.isArray(order.statusHistory)
    ? order.statusHistory
    : [];

  order.statusHistory.push({
    status,
    previousStatus,
    note,
    changedBy: adminId,
    changedAt: new Date(),
  });

  if (status === "confirmed") {
    order.confirmedAt = order.confirmedAt || new Date();
  }

  if (status === "packed") {
    order.processedAt = order.processedAt || new Date();
  }

  if (status === "picking_dispatch") {
    order.shippedAt = order.shippedAt || new Date();
  }

  if (status === "delivered") {
    order.deliveredAt = order.deliveredAt || new Date();

    order.items.forEach((item) => {
      item.status = "delivered";
      item.deliveredAt = item.deliveredAt || new Date();
    });
  }

  await order.save();

  // ✅ COD order delivered hone ke baad payment paid + invoice generate
  if (
    String(order.payment?.method || "").toLowerCase() === "cod" &&
    String(order.status || "").toLowerCase() === "delivered"
  ) {
    return await this.finalizeCodDeliveredOrder(order._id, adminId);
  }

  return order;
}

async finalizeCodDeliveredOrder(orderId, adminId = null) {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const isCOD = String(order.payment?.method || "").toLowerCase() === "cod";
  const isDelivered = String(order.status || "").toLowerCase() === "delivered";

  if (!isCOD || !isDelivered) {
    return order;
  }

  // ✅ COD delivery successful = payment received
  order.payment.status = "paid";
  order.payment.paidAt = order.payment.paidAt || new Date();

  if (!order.payment.transactionId) {
    order.payment.transactionId = `COD-${order.orderId || order._id}`;
  }

  if (!order.payment.paymentId) {
    order.payment.paymentId = `COD-PAY-${Date.now()}`;
  }

  // ✅ Duplicate invoice avoid
  const existingInvoice = await Invoice.findOne({ order: order._id });

  if (existingInvoice) {
    await order.save();
    return order;
  }

  // ✅ Same invoice service use karo jo paid test flow me already use ho raha hai
  await invoiceService.generateInvoice(order._id, adminId, "auto");

  await order.save();

  return order;
}


async deleteOrder(orderId, userRole) {
  if (!['super_admin', 'sub_admin'].includes(userRole)) {
    throw new ApiError(403, 'Only admin can delete orders');
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  await Order.findByIdAndDelete(orderId);

  return order;
}

  async updatePaymentStatus(orderId, paymentStatus, transactionId = null) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    order.payment.status = paymentStatus;
    if (transactionId) {
      order.payment.transactionId = transactionId;
    }

    if (paymentStatus === 'paid') {
      order.payment.paidAt = new Date();
    }

    await order.save();

    return order;
  }
async markPaymentDoneTest(orderId, userId, userRole) {
  const query = { _id: orderId };

  if (userRole !== 'super_admin' && userRole !== 'sub_admin') {
    query.user = userId;
  }

  const order = await Order.findOne(query);

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.payment.status === 'paid') {
    return order;
  }

  order.payment.status = 'paid';
  order.payment.method = order.payment.method || 'cod';
  order.payment.transactionId = `TEST_TXN_${Date.now()}`;
  order.payment.paymentId = `TEST_PAY_${Date.now()}`;
  order.payment.paidAt = new Date();

  order.status = 'confirmed';
  order.confirmedAt = new Date();

  // ✅ Important fix
  order.orderStatusHistory = Array.isArray(order.orderStatusHistory)
    ? order.orderStatusHistory
    : [];

  order.orderStatusHistory.push({
    status: 'confirmed',
    message: 'Payment marked as done for testing.',
    updatedBy: userId,
    createdAt: new Date(),
  });

  await order.save();

  // Auto-generate invoice after payment done
  await invoiceService.generateInvoice(order._id, userId, 'auto');

  return order;
}


  async cancelOrder(orderId, userId, userRole, reason) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (
      userRole !== 'super_admin' &&
      userRole !== 'sub_admin' &&
      order.user.toString() !== userId.toString()
    ) {
      throw new ApiError(403, 'You can only cancel your own orders');
    }

    if (order.status !== 'pending' && order.status !== 'confirmed') {
      throw new ApiError(400, 'Order cannot be cancelled at this stage');
    }

    for (const item of order.items) {
      if (item.variant) {
        await ProductVariant.findByIdAndUpdate(item.variant, {
          $inc: { stock: item.quantity },
        });
      } else {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, totalSold: -item.quantity },
        });
      }
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;
       
      order.orderStatusHistory = Array.isArray(order.orderStatusHistory)
  ? order.orderStatusHistory
  : [];

    order.orderStatusHistory.push({
      status: 'cancelled',
      message: `Order cancelled. Reason: ${reason}`,
      updatedBy: userId,
      createdAt: new Date(),
    });

    await order.save();

    return order;
  }

  async getOrderStats() {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalOrders, todayOrders, weekOrders, monthOrders, pendingOrders] =
      await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ createdAt: { $gte: startOfToday } }),
        Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
        Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
        Order.countDocuments({ status: 'pending' }),
      ]);

    const totalRevenue = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    return {
      totalOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      pendingOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
    };
  }
}

module.exports = new OrderService();
