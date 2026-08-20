const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../../middlewares/auth.middleware");
const { uploadBannerImage } = require("../../middlewares/upload.middleware");
const {
  getActiveBanners,
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
} = require("../../controllers/banner.controller");

// Public routes - no authentication required
router.get("/active", getActiveBanners);

// Admin routes - authentication and admin role required
router.use(protect);
router.use(restrictTo("super_admin", "sub_admin"));

// Get all banners (admin)
router.get("/", getAllBanners);

// Get single banner
router.get("/:id", getBannerById);

// Create banner - Using multer with error handling
router.post(
  "/",
  (req, res, next) => {
    // Check content type
    const contentType = req.headers["content-type"] || "";

    console.log("Content-Type:", contentType);
    console.log("Request headers:", req.headers);

    if (contentType.includes("multipart/form-data")) {
      // If it's multipart/form-data, use multer
      uploadBannerImage(req, res, (err) => {
        if (err) {
          console.error("Multer error:", err);
          return res.status(400).json({
            success: false,
            message: err.message || "File upload error",
          });
        }
        console.log("After multer - req.body:", req.body);
        console.log("After multer - req.file:", req.file);
        next();
      });
    } else {
      // If it's JSON, parse body using express.json()
      express.json()(req, res, (err) => {
        if (err) {
          console.error("JSON parse error:", err);
          return res.status(400).json({
            success: false,
            message: "Invalid JSON payload",
          });
        }
        console.log("JSON body:", req.body);
        next();
      });
    }
  },
  createBanner,
);

// Update banner - Using multer with error handling
router.put(
  "/:id",
  (req, res, next) => {
    const contentType = req.headers["content-type"] || "";

    if (contentType.includes("multipart/form-data")) {
      uploadBannerImage(req, res, (err) => {
        if (err) {
          console.error("Multer error:", err);
          return res.status(400).json({
            success: false,
            message: err.message || "File upload error",
          });
        }
        next();
      });
    } else {
      express.json()(req, res, (err) => {
        if (err) {
          console.error("JSON parse error:", err);
          return res.status(400).json({
            success: false,
            message: "Invalid JSON payload",
          });
        }
        next();
      });
    }
  },
  updateBanner,
);

// Delete banner
router.delete("/:id", deleteBanner);

// Toggle banner status
router.patch("/:id/toggle-status", toggleBannerStatus);

module.exports = router;
