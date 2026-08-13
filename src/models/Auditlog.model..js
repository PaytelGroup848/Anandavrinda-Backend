const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    // ─── Who ──────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null = unauthenticated action
    },

    userSnapshot: {
      name: String,
      email: String,
      role: String,
    },

    // ─── What ─────────────────────────────────────────────
    action: {
      type: String,
      required: true,
      // e.g. "login", "logout", "vendor_approved", "order_cancelled"
    },

    module: {
      type: String,
      required: true,
      enum: [
        "auth",
        "user",
        "vendor",
        "product",
        "order",
        "payment",
        "coupon",
        "review",
        "category",
        "settings",
        "notification",
      ],
    },

    // ─── Details ──────────────────────────────────────────
    description: {
      type: String,
      required: true,
    },

    // Kya change hua — before aur after
    changes: {
      before: { type: mongoose.Schema.Types.Mixed, default: null },
      after: { type: mongoose.Schema.Types.Mixed, default: null },
    },

    // Affected resource
    resource: {
      type: {
        type: String,
        default: null,
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },

    // ─── Where / How ──────────────────────────────────────
    ipAddress: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },

    // ─── Result ───────────────────────────────────────────
    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
    },

    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

// 1 saal purane logs automatically delete
auditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 365 }
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;