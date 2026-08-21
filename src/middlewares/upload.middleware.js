const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const uploadDirs = {
  products: process.env.UPLOAD_PATH || "./uploads/products",
  banners: process.env.BANNER_UPLOAD_PATH || "./uploads/banners",
  categories: process.env.CATEGORY_UPLOAD_PATH || "./uploads/categories",
  blogs: process.env.BLOG_UPLOAD_PATH || "./uploads/blogs", // Add this
};

// Create all upload directories
Object.values(uploadDirs).forEach((dir) => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${fullPath}`);
  }
});

// Configure storage with dynamic destination
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadDirs.products; // default

    console.log("=== UPLOAD DEBUG ===");
    console.log("req.path:", req.path);
    console.log("req.baseUrl:", req.baseUrl);
    console.log("file.fieldname:", file.fieldname);

    if (req.path && req.path.includes("/blogs")) {
      uploadPath = uploadDirs.blogs;
      console.log(" Using blogs directory");
    } else if (
      file.fieldname === "blogImage" ||
      file.fieldname === "featuredImage"
    ) {
      uploadPath = uploadDirs.blogs;
      console.log(" Using blogs directory");
    }

    // Check if it's a banner upload - check the route path
    const isBannerRoute =
      req.path &&
      (req.path.includes("/banners") ||
        req.path.includes("banner") ||
        req.baseUrl?.includes("/banners") ||
        req.baseUrl?.includes("banner"));

    if (isBannerRoute || file.fieldname === "bannerImage") {
      uploadPath = uploadDirs.banners;
      console.log("Using banners directory");
    } else if (file.fieldname === "categoryImage") {
      uploadPath = uploadDirs.categories;
      console.log(" Using categories directory");
    } else if (
      file.fieldname === "images" ||
      file.fieldname === "productImage" ||
      file.fieldname === "image"
    ) {
      uploadPath = uploadDirs.products;
      console.log("✅ Using products directory");
    }

    // Ensure the specific directory exists
    const fullPath = path.join(process.cwd(), uploadPath);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    console.log(`📁 Uploading file to: ${fullPath}`);
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const filename = `${sanitizedName}-${uniqueSuffix}${ext}`;
    console.log(`📄 Generated filename: ${filename}`);
    cb(null, filename);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Only images are allowed. Received: ${file.mimetype}`), false);
  }
};

// Configure upload with limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: fileFilter,
});

// Multiple images upload (max 5 images)
const uploadMultiple = upload.array("images", 5);

// Single image upload
const uploadSingle = upload.single("image");
const uploadBlogImage = upload.single("featuredImage");
// Banner image upload (using 'image' field)
const uploadBannerImage = upload.single("image");

module.exports = {
  upload,
  uploadMultiple,
  uploadSingle,
  uploadBannerImage,
  uploadBlogImage,
};
