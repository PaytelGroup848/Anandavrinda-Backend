const cartService = require('../services/cart.service');
const ApiResponse = require('../utils/ApiResponse');

class CartController {
  async getCart(req, res, next) {
    try {
      const result = await cartService.getCart(req.user._id);
      res.status(200).json(ApiResponse.success('Cart fetched successfully', result));
    } catch (error) {
      next(error);
    }
  }

  async getCartSummary(req, res, next) {
    try {
      const couponCode = String(req.query.couponCode || '').trim().toUpperCase();
      const result = await cartService.getCartSummary(req.user._id, couponCode);

      res
        .status(200)
        .json(ApiResponse.success('Cart summary fetched successfully', result));
    } catch (error) {
      next(error);
    }
  }

  async addToCart(req, res, next) {
    try {
      const { productId, quantity, variantId } = req.body;
      const result = await cartService.addToCart(
        req.user._id,
        productId,
        quantity,
        variantId
      );

      res
        .status(200)
        .json(ApiResponse.success('Product added to cart successfully', result));
    } catch (error) {
      next(error);
    }
  }

  async updateQuantity(req, res, next) {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;
      const result = await cartService.updateQuantity(req.user._id, itemId, quantity);

      res.status(200).json(ApiResponse.success('Cart updated successfully', result));
    } catch (error) {
      next(error);
    }
  }

  async removeItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const result = await cartService.removeItem(req.user._id, itemId);

      res
        .status(200)
        .json(ApiResponse.success('Item removed from cart successfully', result));
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req, res, next) {
    try {
      const result = await cartService.clearCart(req.user._id);
      res.status(200).json(ApiResponse.success('Cart cleared successfully', result));
    } catch (error) {
      next(error);
    }
  }

  async applyCoupon(req, res, next) {
    try {
      const { couponCode } = req.body;
      const result = await cartService.applyCoupon(req.user._id, couponCode);

      res.status(200).json(ApiResponse.success('Coupon applied successfully', result));
    } catch (error) {
      next(error);
    }
  }

  async removeCoupon(req, res, next) {
    try {
      const result = await cartService.removeCoupon(req.user._id);
      res.status(200).json(ApiResponse.success('Coupon removed successfully', result));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CartController();
