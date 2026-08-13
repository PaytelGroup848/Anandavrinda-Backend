const express = require('express');
const router = express.Router();
const settingsController = require('../../controllers/settings.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// ==================== PUBLIC ROUTES ====================
router.get('/vendor-registration', settingsController.getVendorRegistrationStatus);
router.get('/store-info', settingsController.getStoreInfo);
router.get('/maintenance', settingsController.checkMaintenance);
router.get('/order', settingsController.getOrderSettings);
router.get('/tax', settingsController.getTaxSettings);

// ==================== ADMIN ONLY ROUTES ====================
router.use(protect);
router.use(restrictTo('super_admin', 'sub_admin'));

// General Settings
router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

// Vendor Settings
router.put('/vendor-registration', settingsController.updateVendorRegistration);
router.put('/vendor-approval', settingsController.updateVendorApproval);
router.put('/vendor-auto-approve', settingsController.updateVendorAutoApprove);
router.put('/vendor-commission', settingsController.updateVendorCommission);

// Order Settings
router.put('/order', settingsController.updateOrderSettings);

// Tax Settings
router.put('/tax', settingsController.updateTaxSettings);

// Commission Settings
router.get('/commission', settingsController.getCommissionSettings);
router.put('/commission', settingsController.updateCommissionSettings);

module.exports = router;