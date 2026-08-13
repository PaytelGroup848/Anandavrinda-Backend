const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');
const { canView, canCreate, canEdit, canDelete, hasPermission } = require('../../middlewares/permission.middleware');
const reportController = require('../../controllers/report.controller');

// All admin routes require authentication and admin role
router.use(protect);
router.use(restrictTo('super_admin', 'sub_admin'));

// ==================== DASHBOARD ====================
router.get('/dashboard', adminController.getDashboardStats);

// ==================== VENDOR MANAGEMENT ====================
router.get('/vendors', adminController.getAllVendors);
router.get('/vendors/:id', adminController.getVendorById);
router.post('/vendors', adminController.createVendor);
router.put('/vendors/:id/approve', adminController.approveVendor);
router.put('/vendors/:id/reject', adminController.rejectVendor);
router.put('/vendors/:id/suspend', adminController.suspendVendor);
router.put('/vendors/:id/activate', adminController.activateVendor);

// ==================== USER MANAGEMENT ====================
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// ==================== CATEGORY MANAGEMENT ====================
router.get('/categories', adminController.getAllCategories);
router.get('/categories/:id', adminController.getCategoryById);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// ==================== PRODUCT MANAGEMENT ====================
router.get('/products', adminController.getAllProducts);
router.get('/products/:id', adminController.getProductById);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);
router.put('/products/:id/status', adminController.updateProductStatus);

// ==================== ORDER MANAGEMENT ====================
router.get('/orders', adminController.getAllOrders);
router.get('/orders/:id', adminController.getOrderById);
router.put('/orders/:id/status', adminController.updateOrderStatus);

// ==================== CUSTOMER MANAGEMENT ====================
router.get('/customers', adminController.getAllCustomers);
router.get('/customers/:id', adminController.getCustomerById);
router.put('/customers/:id', adminController.updateCustomer);

// ==================== REPORTS ====================
router.get('/reports/summary',      reportController.getSummary);
router.get('/reports/top-products', reportController.getTopProducts);
router.get('/reports/full',         reportController.getFullReport);
router.get('/reports',              reportController.getFullReport);

module.exports = router;