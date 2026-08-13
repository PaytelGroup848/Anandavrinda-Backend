const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // ─── Recipient ────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ─── Content ──────────────────────────────────────────
    type: {
      type: String,
      enum: [
        "order_placed",
        "order_confirmed",
        "order_shipped",
        "order_delivered",
        "order_cancelled",
        "payment_success",
        "payment_failed",
        "vendor_approved",
        "vendor_rejected",
        "review_received",
        "low_stock",
        "withdrawal_approved",
        "withdrawal_rejected",
        "general",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      maxlength: 100,
    },

    message: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // ─── Action ───────────────────────────────────────────
    // Click karne par kahan jaye
    actionUrl: {
      type: String,
      default: null,
    },

    // ─── Reference ────────────────────────────────────────
    // Kis cheez ke baare mein hai ye notification
    reference: {
      type: {
        type: String,
        enum: ["order", "product", "review", "withdrawal", null],
        default: null,
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },

    // ─── Status ───────────────────────────────────────────
    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });

// 90 din purani notifications automatically delete
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;