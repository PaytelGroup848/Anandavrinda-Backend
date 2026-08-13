const ProductVariant = require('../models/productvarient.model');
const Product = require('../models/Products.model');
const ApiError = require('../utils/ApiError');
const uploadService = require('./upload.service');

class VariantService {
  // Create variant
  async createVariant(productId, variantData, userId, isAdmin = false) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Check permission
    if (!isAdmin && product.vendor && product.vendor.toString() !== userId) {
      throw new ApiError(403, 'You can only add variants to your own products');
    }

    const { name, sku, attributes, price, originalPrice, stock, lowStockThreshold, image } =
      variantData;

    // Validation
    if (!name || !name.trim()) {
      throw new ApiError(400, 'Variant name is required');
    }

    if (!price || price <= 0) {
      throw new ApiError(400, 'Valid variant price is required');
    }

    if (!attributes || attributes.length === 0) {
      throw new ApiError(400, 'At least one attribute is required');
    }

    // Check SKU uniqueness
    if (sku) {
      const existingSku = await ProductVariant.findOne({ sku });
      if (existingSku) {
        throw new ApiError(400, 'Variant with this SKU already exists');
      }
    }

    const variant = await ProductVariant.create({
      product: productId,
      name: name.trim(),
      sku: sku || null,
      attributes,
      price,
      originalPrice: originalPrice || null,
      stock: stock || 0,
      lowStockThreshold: lowStockThreshold || 5,
      image: image || null,
      isActive: true,
      displayOrder: variantData.displayOrder || 0,
    });

    // Update product hasVariants flag
    if (!product.hasVariants) {
      product.hasVariants = true;
      await product.save();
    }

    return variant;
  }

  // Get variants by product
  async getVariantsByProduct(productId) {
    const variants = await ProductVariant.find({
      product: productId,
      isActive: true,
    }).sort({ displayOrder: 1 });

    return variants;
  }

  // Get variant by ID
  async getVariantById(variantId) {
    const variant = await ProductVariant.findById(variantId).populate('product', 'name slug');
    if (!variant) {
      throw new ApiError(404, 'Variant not found');
    }
    return variant;
  }

  // Update variant
  async updateVariant(variantId, updateData, userId, isAdmin = false) {
    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      throw new ApiError(404, 'Variant not found');
    }

    const product = await Product.findById(variant.product);
    if (!isAdmin && product.vendor && product.vendor.toString() !== userId) {
      throw new ApiError(403, 'You can only update variants of your own products');
    }

    // Check SKU uniqueness if being updated
    if (updateData.sku && updateData.sku !== variant.sku) {
      const existingSku = await ProductVariant.findOne({ sku: updateData.sku });
      if (existingSku) {
        throw new ApiError(400, 'Variant with this SKU already exists');
      }
    }

    const updatedVariant = await ProductVariant.findByIdAndUpdate(variantId, updateData, {
      new: true,
      runValidators: true,
    });

    return updatedVariant;
  }

  // Delete variant
  async deleteVariant(variantId, userId, isAdmin = false) {
    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      throw new ApiError(404, 'Variant not found');
    }

    const product = await Product.findById(variant.product);
    if (!isAdmin && product.vendor && product.vendor.toString() !== userId) {
      throw new ApiError(403, 'You can only delete variants of your own products');
    }
        if (variant.image?.publicId || variant.image?.url) {
      await uploadService.deleteImage(variant.image.publicId || variant.image.url, 'products');
    }
;

    await variant.deleteOne();

    // Check if product has any remaining variants
    const remainingVariants = await ProductVariant.countDocuments({
      product: variant.product,
      isActive: true,
    });

    if (remainingVariants === 0) {
      product.hasVariants = false;
      await product.save();
    }

    return true;
  }

  // Toggle variant status
  async toggleVariantStatus(variantId, userId, isAdmin = false) {
    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      throw new ApiError(404, 'Variant not found');
    }

    const product = await Product.findById(variant.product);
    if (!isAdmin && product.vendor && product.vendor.toString() !== userId) {
      throw new ApiError(403, 'You can only update variants of your own products');
    }

    variant.isActive = !variant.isActive;
    await variant.save();

    return variant;
  }
}

module.exports = new VariantService();