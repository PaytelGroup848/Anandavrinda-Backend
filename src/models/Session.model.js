const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    // ─── User Reference ───────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ─── Token ────────────────────────────────────────────
    // Refresh token yahan store hoga
    refreshToken: {
      type: String,
      required: true,
    },

    // ─── Device Info ──────────────────────────────────────
    // Kaun sa device hai — browser, mobile, etc
    deviceId: {
      type: String,
      required: true,
    },

    deviceName: {
      type: String,
      default: "Unknown Device",
    },

    deviceType: {
      type: String,
      enum: ["web", "android", "ios", "desktop", "unknown"],
      default: "unknown",
    },

    browser: {
      type: String,
      default: null,
    },

    os: {
      type: String,
      default: null,
    },

    // ─── Location ─────────────────────────────────────────
    ipAddress: {
      type: String,
      default: null,
    },

    location: {
      city: String,
      country: String,
    },

    // ─── Status ───────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    // Token kab expire hoga
    expiresAt: {
      type: Date,
      required: true,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────
sessionSchema.index({ user: 1 });
sessionSchema.index({ refreshToken: 1 });
sessionSchema.index({ user: 1, deviceId: 1 });

// TTL Index — expire hone ke baad MongoDB automatically delete karta hai
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;