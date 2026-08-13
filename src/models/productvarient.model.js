const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      unique: true, // ✅ Already creates index
      sparse: true,
    },

    attributes: [
      {
        name: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    originalPrice: {
      type: Number,
      default: null,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    lowStockThreshold: {
      type: Number,
      default: 5,
    },

    image: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────
// ✅ REMOVED duplicate sku index (unique: true already creates it)
// productVariantSchema.index({ sku: 1 });

productVariantSchema.index({ product: 1 });
productVariantSchema.index({ product: 1, isActive: 1 });

const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);

module.exports = ProductVariant;