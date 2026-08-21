const express = require("express");
const router = express.Router();

// Import all routes
const authRoutes = require("./v1/auth.routes");
const categoryRoutes = require("./v1/category.routes");
const productRoutes = require("./v1/product.routes");
const cartRoutes = require("./v1/cart.routes");
const wishlistRoutes = require("./v1/wishlist.routes");
const settingsRoutes = require("./v1/settings.routes");
const adminRoutes = require("./v1/admin.routes");
const couponRoutes = require("./v1/coupon.routes");
const userRoutes = require("./v1/user.routes");
const orderRoutes = require("./v1/order.routes");
const uploadRoutes = require("./v1/upload.routes");
const invoiceRoutes = require("./v1/invoice.route");
const paymentRoutes = require("./v1/payment.routes");
const supportRoutes = require("./v1/support.routes");
const contactRoutes = require("./v1/contact.routes");
const bannerRoutes = require("./v1/banner.routes");
const blogRoutes = require("./v1/blog.routes");
// Register routes
router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/settings", settingsRoutes);
router.use("/admin", adminRoutes);
router.use("/coupons", couponRoutes);
router.use("/users", userRoutes);
router.use("/orders", orderRoutes);
router.use("/upload", uploadRoutes);
router.use("/support", supportRoutes);
router.use("/contact", contactRoutes);
router.use("/payments", paymentRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/banners", bannerRoutes);
router.use("/blogs", blogRoutes);
// Health check
router.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", version: "1.0.0" });
});

module.exports = router;
