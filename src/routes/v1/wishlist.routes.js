const express = require('express');
const router = express.Router();
const wishlistController = require('../../controllers/wishlist.controller');
const { protect } = require('../../middlewares/auth.middleware');

// All wishlist routes require authentication
router.use(protect);

router.get('/', wishlistController.getWishlist);
router.get('/check/:productId', wishlistController.checkInWishlist);
router.post('/add/:productId', wishlistController.addToWishlist);
router.delete('/remove/:productId', wishlistController.removeFromWishlist);
router.delete('/clear', wishlistController.clearWishlist);
router.post('/move-to-cart/:productId', wishlistController.moveToCart);

module.exports = router;