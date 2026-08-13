const express = require('express');
const router = express.Router();

const cartController = require('../../controllers/cart.controller');
const { protect } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validation.middleware');

const {
  addToCartSchema,
  updateQuantitySchema,
  applyCouponSchema,
} = require('../../Validation/cart.validation');

// Public route only for debugging route mounting.
// Open: http://localhost:5000/api/v1/cart/test
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Cart route file is working',
  });
});

// All cart routes below this line require authentication.
router.use(protect);

router.get('/', cartController.getCart);
router.get('/summary', cartController.getCartSummary);

router.post('/add', validate(addToCartSchema), cartController.addToCart);
router.put('/items/:itemId', validate(updateQuantitySchema), cartController.updateQuantity);
router.delete('/items/:itemId', cartController.removeItem);
router.delete('/clear', cartController.clearCart);
router.post('/apply-coupon', validate(applyCouponSchema), cartController.applyCoupon);
router.delete('/remove-coupon', cartController.removeCoupon);

module.exports = router;
