const express = require('express');
const router = express.Router();
const productController = require('../../controllers/product.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// ==================== PUBLIC ROUTES ====================
router.get('/', productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/search', productController.searchProducts);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/:id', productController.getProductById);

// ==================== PROTECTED ROUTES ====================
router.use(protect);

// Vendor routes
router.get('/vendor/products', productController.getVendorProducts);

// Create product (Admin + Vendor)
router.post('/', productController.createProduct);

// Update, Delete, Status (Admin + Vendor with permission)
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.patch('/:id/status', productController.updateProductStatus);

// Variant routes
router.get('/:productId/variants', productController.getVariantsByProduct);
router.post('/:productId/variants', productController.createVariant);
router.get('/variants/:variantId', productController.getVariantById);
router.put('/variants/:variantId', productController.updateVariant);
router.delete('/variants/:variantId', productController.deleteVariant);
router.patch('/variants/:variantId/toggle', productController.toggleVariantStatus);




module.exports = router;