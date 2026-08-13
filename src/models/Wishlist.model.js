const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // ✅ Already creates index
    },

    items: [
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

        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────
// ✅ REMOVED duplicate user index (unique: true already creates it)
// wishlistSchema.index({ user: 1 });

wishlistSchema.index({ "items.product": 1 });

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

module.exports = Wishlist;