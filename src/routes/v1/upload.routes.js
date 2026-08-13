const express = require('express');
const router = express.Router();
const uploadController = require('../../controllers/upload.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');
const { uploadMultiple } = require('../../config/multer.config');

// All upload routes require authentication
router.use(protect);

// Upload multiple images for product
router.post(
  '/products/:productId/images',
  restrictTo('super_admin', 'sub_admin', 'vendor'),
  uploadMultiple,
  uploadController.uploadProductImages
);

// Delete product image
router.delete(
  '/products/:productId/images/:imageId',
  restrictTo('super_admin', 'sub_admin', 'vendor'),
  uploadController.deleteProductImage
);

// Update image order
router.put(
  '/products/:productId/images/order',
  restrictTo('super_admin', 'sub_admin', 'vendor'),
  uploadController.updateImageOrder
);

// Toggle main image
router.put(
  '/products/:productId/images/:imageId/main',
  restrictTo('super_admin', 'sub_admin', 'vendor'),
  uploadController.toggleMainImage
);

module.exports = router;