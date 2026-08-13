const uploadService = require('../services/upload.service');
const Product = require('../models/Products.model');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

class UploadController {
  // Upload product images
  async uploadProductImages(req, res, next) {
    try {
      const { productId } = req.params;
      const files = req.files;

      if (!files || files.length === 0) {
        throw new ApiError(400, 'No images uploaded');
      }

      // Get product
      const product = await Product.findById(productId);
      if (!product) {
        throw new ApiError(404, 'Product not found');
      }

      // Process uploaded images
      const uploadedImages = await uploadService.uploadMultipleImages(files, `products/${productId}`);

      // Prepare images for database
      const newImages = uploadedImages.map((img, index) => ({
        url: img.url,
        publicId: img.publicId,
        isMain: product.images.length === 0 && index === 0,
        displayOrder: product.images.length + index,
      }));

      // Update product
      product.images.push(...newImages);
      await product.save();

      res.status(200).json(
        ApiResponse.success('Images uploaded successfully', { 
          images: newImages,
          total: product.images.length,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Delete product image
  async deleteProductImage(req, res, next) {
    try {
      const { productId, imageId } = req.params;

      const product = await Product.findById(productId);
      if (!product) {
        throw new ApiError(404, 'Product not found');
      }

      // Find image
      const imageIndex = product.images.findIndex(img => img.publicId === imageId);
      if (imageIndex === -1) {
        throw new ApiError(404, 'Image not found');
      }

      const image = product.images[imageIndex];

      // Delete file from disk
      await uploadService.deleteImage(image.publicId);

      // Remove from product
      product.images.splice(imageIndex, 1);

      // If deleted image was main, set first as main
      if (image.isMain && product.images.length > 0) {
        product.images[0].isMain = true;
      }

      await product.save();

      res.status(200).json(
        ApiResponse.success('Image deleted successfully', { 
          remaining: product.images.length,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Update image order
  async updateImageOrder(req, res, next) {
    try {
      const { productId } = req.params;
      const { imageIds } = req.body; // Array of publicIds in order

      const product = await Product.findById(productId);
      if (!product) {
        throw new ApiError(404, 'Product not found');
      }

      // Update display order
      imageIds.forEach((publicId, index) => {
        const img = product.images.find(i => i.publicId === publicId);
        if (img) {
          img.displayOrder = index;
        }
      });

      await product.save();

      res.status(200).json(
        ApiResponse.success('Image order updated successfully', { images: product.images })
      );
    } catch (error) {
      next(error);
    }
  }

  // Toggle main image
  async toggleMainImage(req, res, next) {
    try {
      const { productId, imageId } = req.params;

      const product = await Product.findById(productId);
      if (!product) {
        throw new ApiError(404, 'Product not found');
      }

      // Find and update
      product.images.forEach(img => {
        img.isMain = img.publicId === imageId;
      });

      await product.save();

      res.status(200).json(
        ApiResponse.success('Main image updated successfully', { images: product.images })
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UploadController();