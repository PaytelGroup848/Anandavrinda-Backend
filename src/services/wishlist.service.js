const Wishlist = require('../models/Wishlist.model');
const Product = require('../models/Products.model');
const ProductVariant = require('../models/productvarient.model');
const ApiError = require('../utils/ApiError');

class WishlistService {
  async getWishlist(userId) {
    let wishlist = await Wishlist.findOne({ user: userId })
      .populate('items.product', 'name slug price originalPrice images rating totalSold stock status')
      .populate('items.variant', 'name price originalPrice stock attributes');
    
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: userId,
        items: [],
      });
    }
    
    return wishlist;
  }
  
  async addToWishlist(userId, productId, variantId = null) {
    // Check if product exists and is active
    const product = await Product.findOne({
      _id: productId,
      status: 'active',
    });
    
    if (!product) {
      throw new ApiError(404, 'Product not found or inactive');
    }
    
    // If variant provided, check variant exists
    if (variantId) {
      const variant = await ProductVariant.findOne({
        _id: variantId,
        product: productId,
        isActive: true,
      });
      
      if (!variant) {
        throw new ApiError(404, 'Variant not found');
      }
    }
    
    // Get or create wishlist
    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: userId,
        items: [],
      });
    }
    
    // Check if item already exists in wishlist (same product and variant)
    const existingItem = wishlist.items.find(
      item => item.product.toString() === productId && 
               (variantId ? item.variant?.toString() === variantId : !item.variant)
    );
    
    if (existingItem) {
      throw new ApiError(400, 'Product already in wishlist');
    }
    
    // Add to wishlist
    wishlist.items.push({
      product: productId,
      variant: variantId,
      addedAt: new Date(),
    });
    
    await wishlist.save();
    
    return this.getWishlist(userId);
  }
  
  async removeFromWishlist(userId, productId, variantId = null) {
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      throw new ApiError(404, 'Wishlist not found');
    }
    
    // Find index of item to remove
    const itemIndex = wishlist.items.findIndex(
      item => item.product.toString() === productId && 
               (variantId ? item.variant?.toString() === variantId : !item.variant)
    );
    
    if (itemIndex === -1) {
      throw new ApiError(404, 'Product not found in wishlist');
    }
    
    // Remove item
    wishlist.items.splice(itemIndex, 1);
    await wishlist.save();
    
    return this.getWishlist(userId);
  }
  
  async clearWishlist(userId) {
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      throw new ApiError(404, 'Wishlist not found');
    }
    
    wishlist.items = [];
    await wishlist.save();
    
    return this.getWishlist(userId);
  }
  
  async moveToCart(userId, productId, variantId = null, quantity = 1) {
    // First remove from wishlist
    await this.removeFromWishlist(userId, productId, variantId);
    
    // Then add to cart (using cart service)
    const cartService = require('./cart.service');
    return await cartService.addToCart(userId, productId, quantity, variantId);
  }
  
  async isInWishlist(userId, productId, variantId = null) {
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) return false;
    
    return wishlist.items.some(
      item => item.product.toString() === productId && 
               (variantId ? item.variant?.toString() === variantId : !item.variant)
    );
  }
}

module.exports = new WishlistService();