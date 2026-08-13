const express = require('express');
const router = express.Router();
const couponController = require('../../controllers/coupon.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// ==================== PUBLIC ROUTES ====================
router.get('/validate/:code', couponController.getCouponByCode);
router.get('/active', couponController.getActiveCoupons);

// ==================== PROTECTED ROUTES ====================
router.use(protect);

// Vendor routes
router.get('/vendor/my-coupons', restrictTo('vendor'), couponController.getVendorCoupons);

// Admin only routes
router.use(restrictTo('super_admin', 'sub_admin'));

router.get('/', couponController.getAllCoupons);
router.get('/expired', couponController.getExpiredCoupons);
router.post('/', couponController.createCoupon);
router.get('/:id', couponController.getCouponById);
router.put('/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deleteCoupon);
router.patch('/:id/toggle', couponController.toggleCouponStatus);

module.exports = router;