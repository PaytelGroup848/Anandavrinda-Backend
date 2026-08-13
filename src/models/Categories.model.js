const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    slug: {
      type: String,
      required: true,
      unique: true, // ✅ Already creates index
      lowercase: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    image: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 4,
    },

    ancestors: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
        name: String,
        slug: String,
      },
    ],

    displayOrder: {
      type: Number,
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    seo: {
      metaTitle: { type: String, maxlength: 60 },
      metaDescription: { type: String, maxlength: 160 },
      keywords: [String],
    },

    productCount: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdByRole: {
      type: String,
      enum: ["super_admin", "sub_admin", "vendor", "customer"],
      default: "super_admin",
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────
// ✅ REMOVED duplicate slug index (unique: true already creates it)
// categorySchema.index({ slug: 1 });

categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1, isFeatured: 1 });
categorySchema.index({ level: 1, isActive: 1 });
categorySchema.index({ displayOrder: 1 });
categorySchema.index({ createdBy: 1, createdByRole: 1 });

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;