const Blog = require("../models/Blog");
const fs = require("fs");
const path = require("path");

const deleteImageFile = (imagePath) => {
  try {
    if (imagePath) {
      const filename = imagePath.split("/").pop();
      const uploadDir = process.env.BLOG_UPLOAD_PATH || "./uploads/blogs";
      const filePath = path.join(uploadDir, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted blog image: ${filePath}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error deleting blog image:", error);
    return false;
  }
};

const getImageUrl = (filename, req) => {
  if (!filename) return "";
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const uploadPath = process.env.BLOG_UPLOAD_PATH || "./uploads/blogs";
  const relativePath = uploadPath.replace("./", "");
  return `${baseUrl}/${relativePath}/${filename}`;
};

exports.getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, category, sort, status, isFeatured } = req.query;

    // Build filter
    const filter = {};

    if (category) filter.category = category;
    if (status === "published") filter.isPublished = true;
    if (status === "draft") filter.isPublished = false;
    if (isFeatured === "true") filter.isFeatured = true;

    // Search
    let searchFilter = {};
    if (search) {
      searchFilter = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
          { excerpt: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ],
      };
    }

    const finalFilter = { ...filter, ...searchFilter };

    // Build sort
    let sortOptions = { publishedAt: -1 }; // default: newest first
    if (sort === "oldest") {
      sortOptions = { publishedAt: 1 };
    } else if (sort === "title") {
      sortOptions = { title: 1 };
    } else if (sort === "views") {
      sortOptions = { views: -1 };
    }

    // Get total count
    const total = await Blog.countDocuments(finalFilter);

    // Get blogs
    const blogs = await Blog.find(finalFilter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate("author", "name email")
      .lean();

    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching blogs",
      error: error.message,
    });
  }
};

// Get single blog by slug
// Get single blog by slug
exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    console.log("Fetching blog with slug:", slug);

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    const blog = await Blog.findOne({ slug }).populate("author", "name email");

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching blog",
      error: error.message,
    });
  }
};

// Get single blog by ID (admin)
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate(
      "author",
      "name email",
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching blog",
      error: error.message,
    });
  }
};

// Create blog
exports.createBlog = async (req, res) => {
  try {
    const {
      title,
      excerpt,
      content,
      category,
      tags,
      readTime,
      isPublished,
      isFeatured,
      publishedAt,
      seoTitle,
      seoDescription,
      imageAlt,
    } = req.body;

    console.log("Create Blog - Request body:", req.body);
    console.log("Create Blog - Request file:", req.file);

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (!excerpt) {
      return res.status(400).json({
        success: false,
        message: "Excerpt is required",
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    let featuredImage = "";
    let imageAltText = imageAlt || title;

    // Check if file was uploaded
    if (req.file) {
      const filename = req.file.filename;
      featuredImage = getImageUrl(filename, req);
    } else {
      return res.status(400).json({
        success: false,
        message: "Featured image is required",
      });
    }

    // Parse tags
    let tagsArray = [];
    if (tags) {
      tagsArray =
        typeof tags === "string"
          ? tags
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t)
          : tags;
    }

    // Generate slug from title
    let slug = title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // If slug is empty, use a default
    if (!slug) {
      slug = "blog-" + Date.now();
    }

    // Check if slug already exists
    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
      // Append timestamp to make it unique
      slug = slug + "-" + Date.now();
    }

    // Get user ID
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const blog = new Blog({
      title: title.trim(),
      slug: slug,
      excerpt: excerpt.trim(),
      content: content.trim(),
      category,
      tags: tagsArray,
      readTime: parseInt(readTime) || 5,
      isPublished: isPublished === "true" || isPublished === true,
      isFeatured: isFeatured === "true" || isFeatured === true,
      publishedAt: publishedAt || new Date(),
      featuredImage,
      imageAlt: imageAltText,
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || excerpt,
      author: userId,
    });

    await blog.save();

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    // Clean up uploaded file if error
    if (req.file) {
      const filePath = path.join(
        process.env.BLOG_UPLOAD_PATH || "./uploads/blogs",
        req.file.filename,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("Cleaned up uploaded file:", filePath);
      }
    }
    res.status(500).json({
      success: false,
      message: "Error creating blog",
      error: error.message,
    });
  }
};

// Update blog
exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    console.log("Update Blog - Request body:", req.body);
    console.log("Update Blog - Request file:", req.file);

    const {
      title,
      excerpt,
      content,
      category,
      tags,
      readTime,
      isPublished,
      isFeatured,
      publishedAt,
      seoTitle,
      seoDescription,
      imageAlt,
    } = req.body;

    // Handle image upload
    let featuredImage = blog.featuredImage;
    let imageAltText = imageAlt || blog.imageAlt;

    if (req.file) {
      // Delete old image
      if (blog.featuredImage) {
        deleteImageFile(blog.featuredImage);
      }

      const filename = req.file.filename;
      featuredImage = getImageUrl(filename, req);
      imageAltText = imageAlt || title || blog.title;
    }

    // Parse tags
    let tagsArray = blog.tags;
    if (tags) {
      tagsArray =
        typeof tags === "string"
          ? tags
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t)
          : tags;
    }

    // Update slug if title changed
    let slug = blog.slug;
    if (title && title !== blog.title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      if (!slug) {
        slug = "blog-" + Date.now();
      }

      // Check if slug already exists (excluding current blog)
      const existingBlog = await Blog.findOne({ slug, _id: { $ne: blog._id } });
      if (existingBlog) {
        slug = slug + "-" + Date.now();
      }
    }

    // Update blog
    blog.title = title || blog.title;
    blog.slug = slug;
    blog.excerpt = excerpt || blog.excerpt;
    blog.content = content || blog.content;
    blog.category = category || blog.category;
    blog.tags = tagsArray;
    blog.readTime = parseInt(readTime) || blog.readTime;
    blog.isPublished =
      isPublished !== undefined
        ? isPublished === "true" || isPublished === true
        : blog.isPublished;
    blog.isFeatured =
      isFeatured !== undefined
        ? isFeatured === "true" || isFeatured === true
        : blog.isFeatured;
    blog.publishedAt = publishedAt || blog.publishedAt;
    blog.featuredImage = featuredImage;
    blog.imageAlt = imageAltText;
    blog.seoTitle = seoTitle || blog.seoTitle;
    blog.seoDescription = seoDescription || blog.seoDescription;

    await blog.save();

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    if (req.file) {
      const filePath = path.join(
        process.env.BLOG_UPLOAD_PATH || "./uploads/blogs",
        req.file.filename,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).json({
      success: false,
      message: "Error updating blog",
      error: error.message,
    });
  }
};
// Delete blog
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Delete image
    if (blog.featuredImage) {
      deleteImageFile(blog.featuredImage);
    }

    await blog.deleteOne();

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting blog",
      error: error.message,
    });
  }
};

// Toggle publish status
exports.togglePublishStatus = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    blog.isPublished = !blog.isPublished;
    await blog.save();

    res.status(200).json({
      success: true,
      message: `Blog ${blog.isPublished ? "published" : "unpublished"} successfully`,
      data: blog,
    });
  } catch (error) {
    console.error("Error toggling blog status:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling blog status",
      error: error.message,
    });
  }
};

// Toggle featured status
exports.toggleFeaturedStatus = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    blog.isFeatured = !blog.isFeatured;
    await blog.save();

    res.status(200).json({
      success: true,
      message: `Blog ${blog.isFeatured ? "featured" : "unfeatured"} successfully`,
      data: blog,
    });
  } catch (error) {
    console.error("Error toggling featured status:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling featured status",
      error: error.message,
    });
  }
};

// Get blog categories (for filter)
exports.getBlogCategories = async (req, res) => {
  try {
    const categories = await Blog.distinct("category");
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

// Get featured blogs (for frontend)
exports.getFeaturedBlogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const blogs = await Blog.find({ isPublished: true, isFeatured: true })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .populate("author", "name")
      .lean();

    res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    console.error("Error fetching featured blogs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching featured blogs",
      error: error.message,
    });
  }
};
