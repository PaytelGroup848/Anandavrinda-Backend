const express = require("express");
const router = express.Router();
const blogController = require("../../controllers/blog.controller");
const { protect, restrictTo } = require("../../middlewares/auth.middleware");
const { uploadBlogImage } = require("../../middlewares/upload.middleware");

router.get("/categories", blogController.getBlogCategories);

router.get("/featured", blogController.getFeaturedBlogs);

router.get("/:slug", blogController.getBlogBySlug);

router.use(protect);
router.use(restrictTo("super_admin", "sub_admin"));

router.get("/", blogController.getAllBlogs);

router.get("/id/:id", blogController.getBlogById);

router.post("/", uploadBlogImage, blogController.createBlog);

router.put("/:id", uploadBlogImage, blogController.updateBlog);

router.delete("/:id", blogController.deleteBlog);

router.patch("/:id/toggle-publish", blogController.togglePublishStatus);

router.patch("/:id/toggle-featured", blogController.toggleFeaturedStatus);

module.exports = router;
