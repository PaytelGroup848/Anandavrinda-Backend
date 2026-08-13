const express = require('express');
const router = express.Router();

const orderController = require('../../controllers/order.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// All order routes require authentication
router.use(protect);

// ==================== ADMIN ROUTES ====================
// IMPORTANT: admin routes must be before "/:id"

// Get all orders
// Final URL: /api/v1/orders/admin/all
router.get(
  '/admin/all',
  restrictTo('super_admin', 'sub_admin'),
  orderController.getAllOrders
);

// Get single order for admin
// Final URL: /api/v1/orders/admin/:id
router.get(
  '/admin/:id',
  restrictTo('super_admin', 'sub_admin'),
  orderController.getOrderById
);

// Manual update order status
// Final URL: /api/v1/orders/admin/:id/status
router.patch(
  '/admin/:id/status',
  restrictTo('super_admin', 'sub_admin'),
  orderController.updateOrderStatus
);
router.delete('/admin/:id',
  restrictTo('super_admin', 'sub_admin'),
  orderController.deleteOrder);

// Optional PUT support
router.put(
  '/admin/:id/status',
  restrictTo('super_admin', 'sub_admin'),
  orderController.updateOrderStatus
);

// Mark payment done route
// Final URL: /api/v1/orders/:id/payment-done-test
router.post(
  '/:id/payment-done-test',
  orderController.markPaymentDoneTest
);

// ==================== USER ROUTES ====================
// Final URL: /api/v1/orders
router.post('/', orderController.createOrder);

// Final URL: /api/v1/orders/my-orders
router.get('/my-orders', orderController.getUserOrders);

// Final URL: /api/v1/orders/order-id/:orderId
router.get('/order-id/:orderId', orderController.getOrderByOrderId);

// Final URL: /api/v1/orders/:id
router.get('/:id', orderController.getOrderById);

// Final URL: /api/v1/orders/:id/cancel
router.post('/:id/cancel', orderController.cancelOrder);



module.exports = router;