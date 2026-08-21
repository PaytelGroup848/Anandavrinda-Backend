const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      required: [true, "Excerpt is required"],
      trim: true,
      maxlength: [500, "Excerpt cannot exceed 500 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    featuredImage: {
      type: String,
      required: [true, "Featured image is required"],
    },
    imageAlt: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Fragrance",
        "Tradition",
        "Gifting",
        "Rituals",
        "Festivals",
        "Spiritual",
        "Wellness",
        "Lifestyle",
      ],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readTime: {
      type: Number,
      default: 5,
      min: 1,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    seoTitle: {
      type: String,
      trim: true,
      maxlength: [60, "SEO title cannot exceed 60 characters"],
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: [160, "SEO description cannot exceed 160 characters"],
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
blogSchema.index({
  title: "text",
  content: "text",
  excerpt: "text",
  tags: "text",
});
blogSchema.index({ category: 1, isPublished: 1, publishedAt: -1 });
blogSchema.index({ slug: 1 }, { unique: true });
blogSchema.index({ isFeatured: 1, publishedAt: -1 });

// Generate slug before saving
blogSchema.pre("save", async function () {
  // Only generate slug if title is modified or slug is empty
  if (this.isModified("title") || !this.slug) {
    let slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // If slug is empty, use a default
    if (!slug) {
      slug = "blog-" + Date.now();
    }

    // Check if slug already exists
    const Blog = this.constructor;
    let existingBlog = await Blog.findOne({ slug });
    let counter = 1;
    let finalSlug = slug;

    while (existingBlog) {
      finalSlug = `${slug}-${counter}`;
      existingBlog = await Blog.findOne({ slug: finalSlug });
      counter++;
    }

    this.slug = finalSlug;
  }
});

module.exports = mongoose.model("Blog", blogSchema);
