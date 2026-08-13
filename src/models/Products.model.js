const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [300, "Name cannot exceed 300 characters"],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
    },

    shortDescription: {
      type: String,
      maxlength: [500, "Short description cannot exceed 500 characters"],
    },

    sku: {
      type: String,
      unique: true,
      sparse: true, // ✅ Add sparse: true to allow multiple null values
      trim: true,
    },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isAdminProduct: {
      type: Boolean,
      default: false,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    brand: {
      type: String,
      default: null,
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },

    originalPrice: {
      type: Number,
      default: null,
    },

    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    taxClass: {
      type: String,
      enum: ["none", "gst_5", "gst_12", "gst_18", "gst_28"],
      default: "gst_18",
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

    trackInventory: {
      type: Boolean,
      default: true,
    },

    images: [
      {
        url: { type: String, required: true },
        publicId: String,
        isMain: { type: Boolean, default: false },
        displayOrder: { type: Number, default: 0 },
      },
    ],

    hasVariants: {
      type: Boolean,
      default: false,
    },

    specifications: [
      {
        label: String,
        value: String,
      },
    ],

    highlights: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["draft", "active", "inactive", "rejected"],
      default: "draft",
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalRatings: {
      type: Number,
      default: 0,
    },

    totalSold: {
      type: Number,
      default: 0,
    },

    viewCount: {
      type: Number,
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    tags: {
      type: [String],
      default: [],
    },

    unitsPerPack: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────
productSchema.index({ vendor: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ status: 1, isFeatured: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ totalSold: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ tags: 1 });

// Text search index
productSchema.index(
  { name: "text", description: "text", tags: "text" },
  { weights: { name: 10, tags: 5, description: 1 } }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;