const mongoose = require("mongoose");

const otpTokenSchema = new mongoose.Schema(
  {
    // ─── To Whom ──────────────────────────────────────────
    email: {
      type: String,
      required: true,
      lowercase: true,
    },

    // ─── OTP ──────────────────────────────────────────────
    otp: {
      type: String,
      required: true,
      // Hashed store hoga — plain text nahi
    },

    // ─── Purpose ──────────────────────────────────────────
    type: {
      type: String,
      enum: [
        "email_verify",    // Email verify karne ke liye
        "forgot_password", // Password reset ke liye
        "login",           // 2FA login ke liye
        "withdraw",        // Withdrawal confirm ke liye
      ],
      required: true,
    },

    // ─── Security ─────────────────────────────────────────
    // Kitni baar galat OTP enter kiya
    attempts: {
      type: Number,
      default: 0,
      max: 5, // 5 se zyada try karne pe block
    },

    isUsed: {
      type: Boolean,
      default: false,
    },

    // ─── TTL ──────────────────────────────────────────────
    // Ye field ke baad MongoDB automatically document delete kar deta hai
    // OTP 10 minute mein expire
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────
otpTokenSchema.index({ email: 1, type: 1 });

// TTL Index — expiresAt ke baad auto delete
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpToken = mongoose.model("OtpToken", otpTokenSchema);

module.exports = OtpToken;