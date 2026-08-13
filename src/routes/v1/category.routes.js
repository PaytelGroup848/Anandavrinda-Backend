const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/category.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validation.middleware');
const { createCategorySchema, updateCategorySchema } = require('../../Validation/category.validation.js');

// ==================== PUBLIC ROUTES ====================
router.get('/', categoryController.getAllCategories);
router.get('/featured', categoryController.getFeaturedCategories);
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// ==================== PROTECTED ROUTES ====================
router.use(protect);

// Admin + Vendor can create categories
router.post('/', validate(createCategorySchema), categoryController.createCategory);

// Get flat categories (Admin only)
router.get('/admin/all', restrictTo('super_admin', 'sub_admin'), categoryController.getAllCategoriesFlat);

// Get, Update and Delete (Admin + Vendor with permission)
router.get('/:id', categoryController.getCategoryById);
router.put('/:id', validate(updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);
router.patch('/:id/toggle', categoryController.toggleCategoryStatus);

// Vendor specific routes
router.get('/vendor/my-categories', restrictTo('vendor'), categoryController.getVendorCategories);

// Category tree and hierarchy (Public)
router.get('/tree', categoryController.getCategoryTree);
router.get('/tree/:parentId', categoryController.getCategoryTree);
router.get('/:id/hierarchy', categoryController.getCategoryHierarchy);
router.get('/level/:level', categoryController.getCategoriesByLevel);

// Admin only - Bulk operations and stats
router.get('/stats', restrictTo('super_admin', 'sub_admin'), categoryController.getCategoryStats);
router.put('/bulk-order', restrictTo('super_admin', 'sub_admin'), categoryController.bulkUpdateDisplayOrder);

module.exports = router;
