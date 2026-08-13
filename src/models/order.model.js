const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariant",
    default: null,
  },
  name: { type: String, required: true },
  sku: { type: String, default: null },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  originalPrice: { type: Number, default: null },
  discountAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  image: { type: String, default: null },
  variantName: { type: String, default: null },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  vendorCommission: { type: Number, default: 0 },
  vendorEarnings: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled", "returned"],
    default: "pending",
  },
  trackingNumber: { type: String, default: null },
  trackingUrl: { type: String, default: null },
  deliveredAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
  cancellationReason: { type: String, default: null },
  returnedAt: { type: Date, default: null },
  returnReason: { type: String, default: null },
});

const paymentDetailsSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ["cod", "razorpay", "cashfree", "stripe", "paypal", "bank_transfer"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },
  transactionId: { type: String, default: null },
  paymentId: { type: String, default: null },
  orderId: { type: String, default: null },
  signature: { type: String, default: null },

  cashfreeOrderId: { type: String, default: null },
  cashfreePaymentId: { type: String, default: null },

  cashfreePaymentSessionId: {
    type: String,
    default: null,
  },
  cashfreeCfOrderId: {
    type: String,
    default: null,
  },

  cashfreeRawResponse: {
    type: Object,
    default: null,
  },

  cashfreeStatus: { type: String, default: null },
  paymentGatewayResponse: { type: Object, default: null },
  paymentEmailSent: { type: Boolean, default: false },

  paidAt: { type: Date, default: null },
});

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: null },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: "India" },
  landmark: { type: String, default: null },
});

const timelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  message: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true, // ✅ Already creates index
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
    couponDiscount: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 18 },
    total: { type: Number, required: true, min: 0 },

    payment: {
      type: paymentDetailsSchema,
      required: true,
    },

    invoice: {
  isGenerated: {
    type: Boolean,
    default: false,
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    default: null,
  },
  invoiceNumber: {
    type: String,
    default: null,
  },
  generatedAt: {
    type: Date,
    default: null,
  },
},

    shippingAddress: {
      type: addressSchema,
      required: true,
    },

    billingAddress: {
      type: addressSchema,
      default: null,
    },

    shippingMethod: {
      type: String,
      default: "standard",
    },

    shippingTrackingNumber: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'packed',
        'picking_dispatch',
        'delivered',
        'cancelled',
        'returned',
      ],
      default: 'pending',
    },

    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            'pending',
            'confirmed',
            'packed',
            'picking_dispatch',
            'delivered',
            'cancelled',
            'returned',
          ],
        },
        previousStatus: {
          type: String,
        },
        note: {
          type: String,
          trim: true,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    deliveredAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
    },

    customerNote: {
      type: String,
      default: null,
    },

    adminNote: {
      type: String,
      default: null,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    orderedAt: {
      type: Date,
      default: Date.now,
    },

    confirmedAt: { type: Date, default: null },
    processedAt: { type: Date, default: null },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────
// ✅ REMOVED duplicate orderId index (unique: true already creates it)
// orderSchema.index({ orderId: 1 });

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

orderSchema.index({ "payment.cashfreeOrderId": 1 });
orderSchema.index({ "payment.paymentId": 1 });

orderSchema.index({ vendorId: 1, createdAt: -1 });
orderSchema.index({ "payment.transactionId": 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ createdAt: -1, 'payment.status': 1 });
orderSchema.index({ 'items.product': 1 });
orderSchema.index({ 'items.vendor': 1 });

const Order =
  mongoose.models.Order || mongoose.model('Order', orderSchema);

module.exports = Order;