const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    // ─── References ───────────────────────────────────────
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Sirf jo order kiya ho wahi review kar sake
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    // ─── Review Content ───────────────────────────────────
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },

    title: {
      type: String,
      maxlength: [100, "Title cannot exceed 100 characters"],
      default: null,
    },

    comment: {
      type: String,
      required: [true, "Review comment is required"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },

    // Review ke saath photos
    images: [
      {
        url: String,
        publicId: String,
      },
    ],

    // ─── Verified Purchase ────────────────────────────────
    isVerifiedPurchase: {
      type: Boolean,
      default: true, // Order reference se verified maana jayega
    },

    // ─── Helpful Votes ────────────────────────────────────
    helpfulVotes: {
      type: Number,
      default: 0,
    },

    // Kaun logon ne helpful mark kiya
    helpfulVotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ─── Vendor Reply ─────────────────────────────────────
    vendorReply: {
      comment: String,
      repliedAt: Date,
    },

    // ─── Moderation ───────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },

    rejectionReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Ek user ek product pe sirf ek review ─────────────────────
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;