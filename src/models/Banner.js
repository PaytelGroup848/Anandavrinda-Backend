const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    imageAlt: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["hero", "promotional", "featured"],
      default: "hero",
    },
    position: {
      type: Number,
      default: 0,
    },
    ctaText: {
      type: String,
      trim: true,
    },
    ctaLink: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
bannerSchema.index({ type: 1, isActive: 1, position: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model("Banner", bannerSchema);
