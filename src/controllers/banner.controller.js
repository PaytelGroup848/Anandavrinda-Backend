const Banner = require("../models/Banner");
const fs = require("fs");
const path = require("path");

// Helper function to delete image file
const deleteImageFile = (imagePath) => {
  try {
    if (imagePath) {
      // Extract filename from URL or path
      const filename = imagePath.split("/").pop();
      const uploadDir = process.env.BANNER_UPLOAD_PATH || "./uploads/banners";
      const filePath = path.join(uploadDir, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted image: ${filePath}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error deleting image file:", error);
    return false;
  }
};

// Helper function to get image URL
const getImageUrl = (filename, req) => {
  if (!filename) return "";
  // Return URL relative to server
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const uploadPath = process.env.BANNER_UPLOAD_PATH || "./uploads/banners";
  const relativePath = uploadPath.replace("./", "");
  return `${baseUrl}/${relativePath}/${filename}`;
};

// Helper to parse boolean values from form data
const parseBoolean = (value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
};

// Get all banners (admin)
exports.getAllBanners = async (req, res) => {
  try {
    const { type, isActive } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const banners = await Banner.find(filter)
      .sort({ position: 1, createdAt: -1 })
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      data: banners,
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching banners",
      error: error.message,
    });
  }
};

// Get single banner by ID
exports.getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id).populate(
      "createdBy",
      "name email",
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    console.error("Error fetching banner:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching banner",
      error: error.message,
    });
  }
};

// Get active banners for frontend
exports.getActiveBanners = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {
      isActive: true,
      startDate: { $lte: new Date() },
    };

    // Only apply endDate filter if endDate exists in the query
    // For the actual filter, we need to check each banner's endDate
    const banners = await Banner.find(filter).sort({
      position: 1,
      createdAt: -1,
    });

    // Filter banners that have no end date or end date is in the future
    const activeBanners = banners.filter((banner) => {
      if (!banner.endDate) return true;
      return new Date(banner.endDate) >= new Date();
    });

    // If type is specified, filter by type
    const filteredBanners = type
      ? activeBanners.filter((banner) => banner.type === type)
      : activeBanners;

    res.status(200).json({
      success: true,
      data: filteredBanners,
    });
  } catch (error) {
    console.error("Error fetching active banners:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching active banners",
      error: error.message,
    });
  }
};

exports.createBanner = async (req, res) => {
  try {
    // Log the request body and file for debugging
    console.log("Create - Request body:", req.body);
    console.log("Create - Request file:", req.file);
    console.log("Create - User:", req.user);
    console.log("Create - User ID:", req.user?.id || req.user?._id);

    // Check if req.body exists
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid request body. Please ensure Content-Type is set correctly.",
      });
    }

    // Get form data from req.body
    const {
      title,
      subtitle,
      description,
      type,
      position,
      ctaText,
      ctaLink,
      isActive,
      startDate,
      endDate,
      imageAlt,
    } = req.body;

    // Validate required fields
    if (!title) {
      // If there's a file uploaded, clean it up
      if (req.file) {
        const filePath = path.join(
          process.env.BANNER_UPLOAD_PATH || "./uploads/banners",
          req.file.filename,
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    let imageUrl = "";
    let imageAltText = imageAlt || title || "Banner image";

    // Check if file was uploaded
    if (req.file) {
      const filename = req.file.filename;
      imageUrl = getImageUrl(filename, req);
    } else {
      // If no file uploaded and it's a create operation
      return res.status(400).json({
        success: false,
        message: "Image is required. Please upload an image file.",
      });
    }

    // Get user ID from req.user (handle both id and _id)
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const banner = new Banner({
      title: title.trim(),
      subtitle: subtitle ? subtitle.trim() : "",
      description: description ? description.trim() : "",
      image: imageUrl,
      imageAlt: imageAltText,
      type: type || "hero",
      position: parseInt(position) || 0,
      ctaText: ctaText ? ctaText.trim() : "",
      ctaLink: ctaLink ? ctaLink.trim() : "",
      isActive:
        parseBoolean(isActive) !== undefined ? parseBoolean(isActive) : true,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      createdBy: userId,
    });

    await banner.save();

    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: banner,
    });
  } catch (error) {
    console.error("Error creating banner:", error);
    // If there's an error and a file was uploaded, clean it up
    if (req.file) {
      const filePath = path.join(
        process.env.BANNER_UPLOAD_PATH || "./uploads/banners",
        req.file.filename,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).json({
      success: false,
      message: "Error creating banner",
      error: error.message,
    });
  }
};

// Update banner
exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    console.log("Update - Request body:", req.body);
    console.log("Update - Request file:", req.file);

    // Check if req.body exists
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid request body. Please ensure Content-Type is set correctly.",
      });
    }

    const {
      title,
      subtitle,
      description,
      type,
      position,
      ctaText,
      ctaLink,
      isActive,
      startDate,
      endDate,
      imageAlt,
    } = req.body;

    // Handle image upload
    let imageUrl = banner.image;
    let imageAltText = imageAlt || banner.imageAlt;

    if (req.file) {
      // Delete old image file if exists
      if (banner.image) {
        deleteImageFile(banner.image);
      }

      // Set new image URL
      const filename = req.file.filename;
      imageUrl = getImageUrl(filename, req);
      imageAltText = imageAlt || title || "Banner image";
    }

    // Update banner
    banner.title = title ? title.trim() : banner.title;
    banner.subtitle =
      subtitle !== undefined ? subtitle.trim() : banner.subtitle;
    banner.description =
      description !== undefined ? description.trim() : banner.description;
    banner.image = imageUrl;
    banner.imageAlt = imageAltText;
    banner.type = type || banner.type;
    banner.position =
      position !== undefined ? parseInt(position) : banner.position;
    banner.ctaText = ctaText !== undefined ? ctaText.trim() : banner.ctaText;
    banner.ctaLink = ctaLink !== undefined ? ctaLink.trim() : banner.ctaLink;
    banner.isActive =
      parseBoolean(isActive) !== undefined
        ? parseBoolean(isActive)
        : banner.isActive;
    banner.startDate = startDate || banner.startDate;
    banner.endDate = endDate !== undefined ? endDate : banner.endDate;

    await banner.save();

    res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: banner,
    });
  } catch (error) {
    console.error("Error updating banner:", error);
    // If there's an error and a new file was uploaded, clean it up
    if (req.file) {
      const filePath = path.join(
        process.env.BANNER_UPLOAD_PATH || "./uploads/banners",
        req.file.filename,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).json({
      success: false,
      message: "Error updating banner",
      error: error.message,
    });
  }
};

// Update banner
exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    console.log("Update - Request body:", req.body);
    console.log("Update - Request file:", req.file);

    const {
      title,
      subtitle,
      description,
      type,
      position,
      ctaText,
      ctaLink,
      isActive,
      startDate,
      endDate,
      imageAlt,
    } = req.body;

    // Handle image upload
    let imageUrl = banner.image;
    let imageAltText = imageAlt || banner.imageAlt;

    if (req.file) {
      // Delete old image file if exists
      if (banner.image) {
        deleteImageFile(banner.image);
      }

      // Set new image URL
      const filename = req.file.filename;
      imageUrl = getImageUrl(filename, req);
      imageAltText = imageAlt || title || "Banner image";
    }

    // Update banner
    banner.title = title ? title.trim() : banner.title;
    banner.subtitle =
      subtitle !== undefined ? subtitle.trim() : banner.subtitle;
    banner.description =
      description !== undefined ? description.trim() : banner.description;
    banner.image = imageUrl;
    banner.imageAlt = imageAltText;
    banner.type = type || banner.type;
    banner.position =
      position !== undefined ? parseInt(position) : banner.position;
    banner.ctaText = ctaText !== undefined ? ctaText.trim() : banner.ctaText;
    banner.ctaLink = ctaLink !== undefined ? ctaLink.trim() : banner.ctaLink;
    banner.isActive =
      parseBoolean(isActive) !== undefined
        ? parseBoolean(isActive)
        : banner.isActive;
    banner.startDate = startDate || banner.startDate;
    banner.endDate = endDate !== undefined ? endDate : banner.endDate;

    await banner.save();

    res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: banner,
    });
  } catch (error) {
    console.error("Error updating banner:", error);
    // If there's an error and a new file was uploaded, clean it up
    if (req.file) {
      const filePath = path.join(
        process.env.BANNER_UPLOAD_PATH || "./uploads/banners",
        req.file.filename,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).json({
      success: false,
      message: "Error updating banner",
      error: error.message,
    });
  }
};

// Delete banner
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // Delete image file if exists
    if (banner.image) {
      deleteImageFile(banner.image);
    }

    await banner.deleteOne();

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting banner",
      error: error.message,
    });
  }
};

// Toggle banner status
exports.toggleBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.status(200).json({
      success: true,
      message: `Banner ${banner.isActive ? "activated" : "deactivated"} successfully`,
      data: banner,
    });
  } catch (error) {
    console.error("Error toggling banner status:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling banner status",
      error: error.message,
    });
  }
};
