const wishlistService = require('../services/wishlist.service');
const ApiResponse = require('../utils/ApiResponse');

class WishlistController {
  async getWishlist(req, res, next) {
    try {
      const wishlist = await wishlistService.getWishlist(req.user._id);
      res.status(200).json(
        ApiResponse.success('Wishlist fetched successfully', { wishlist })
      );
    } catch (error) {
      next(error);
    }
  }

  async addToWishlist(req, res, next) {
    try {
      const { productId } = req.params;
      const { variantId } = req.body;
      
      const wishlist = await wishlistService.addToWishlist(
        req.user._id, 
        productId, 
        variantId
      );
      
      res.status(200).json(
        ApiResponse.success('Product added to wishlist successfully', { wishlist })
      );
    } catch (error) {
      next(error);
    }
  }

  async removeFromWishlist(req, res, next) {
    try {
      const { productId } = req.params;
      const { variantId } = req.body;
      
      const wishlist = await wishlistService.removeFromWishlist(
        req.user._id, 
        productId, 
        variantId
      );
      
      res.status(200).json(
        ApiResponse.success('Product removed from wishlist successfully', { wishlist })
      );
    } catch (error) {
      next(error);
    }
  }

  async clearWishlist(req, res, next) {
    try {
      const wishlist = await wishlistService.clearWishlist(req.user._id);
      res.status(200).json(
        ApiResponse.success('Wishlist cleared successfully', { wishlist })
      );
    } catch (error) {
      next(error);
    }
  }

  async moveToCart(req, res, next) {
    try {
      const { productId } = req.params;
      const { variantId, quantity } = req.body;
      
      const result = await wishlistService.moveToCart(
        req.user._id, 
        productId, 
        variantId, 
        quantity || 1
      );
      
      res.status(200).json(
        ApiResponse.success('Product moved to cart successfully', result)
      );
    } catch (error) {
      next(error);
    }
  }

  async checkInWishlist(req, res, next) {
    try {
      const { productId } = req.params;
      const { variantId } = req.query;
      
      const isInWishlist = await wishlistService.isInWishlist(
        req.user._id, 
        productId, 
        variantId
      );
      
      res.status(200).json(
        ApiResponse.success('Wishlist status fetched', { isInWishlist })
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WishlistController();