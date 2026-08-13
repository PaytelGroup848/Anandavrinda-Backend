const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
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

    priceSnapshot: {
      price: { type: Number, required: true },
      originalPrice: { type: Number, default: null },
      variantName: { type: String, default: null },
    },

    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },

    isPriceChanged: {
      type: Boolean,
      default: false,
    },

    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // ✅ Already creates index
    },

    items: {
      type: [cartItemSchema],
      default: [],
    },

    appliedCoupon: {
      couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
        default: null,
      },
      code: { type: String, default: null },
      discountAmount: { type: Number, default: 0 },
    },

    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────
// ✅ REMOVED duplicate user index (unique: true already creates it)
// cartSchema.index({ user: 1 });

cartSchema.index({ lastActivityAt: 1 });

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;