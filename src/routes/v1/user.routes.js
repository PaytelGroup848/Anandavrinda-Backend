const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const { protect } = require('../../middlewares/auth.middleware');

// All user routes require authentication
router.use(protect);

// Profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/change-password', userController.changePassword);

// Address routes
router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.addAddress);
router.put('/addresses/:addressId', userController.updateAddress);
router.delete('/addresses/:addressId', userController.deleteAddress);

// Order routes
router.get('/orders', userController.getUserOrders);

// Stats
router.get('/stats', userController.getUserStats);

module.exports = router;