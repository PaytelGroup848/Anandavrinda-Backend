const productService = require("../services/product.service");
const variantService = require("../services/variant.service");
const uploadService = require("../services/upload.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

class ProductController {
  // ==================== PRODUCT CRUD ====================

  // Create product
  async createProduct(req, res, next) {
    try {
      const { images, ...productData } = req.body;
      const isAdmin =
        req.user.role === "super_admin" || req.user.role === "sub_admin";

      // ✅ Handle images upload with full URL
      let processedImages = [];
      if (images && images.length > 0) {
        for (const img of images) {
          if (img.url && img.url.startsWith("data:image")) {
            const uploaded = await uploadService.saveBase64Image(
              img.url,
              "products",
            );
            processedImages.push({
              url: uploaded.url,
              publicId: uploaded.publicId,
              isMain: img.isMain || false,
              displayOrder: img.displayOrder || 0,
            });
          } else if (img.url) {
            processedImages.push({
              url: img.url,
              publicId:
                img.publicId ||
                `product_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              isMain: img.isMain || false,
              displayOrder: img.displayOrder || 0,
            });
          }
        }
      }

      // 🔥 FIX: Ensure variants is passed correctly
      const result = await productService.createProduct(
        {
          ...productData,
          images: processedImages,
          hasVariants: productData.hasVariants,
          variants: productData.variants || [],
        },
        req.user._id,
        isAdmin,
      );

      res
        .status(201)
        .json(ApiResponse.success("Product created successfully", result));
    } catch (error) {
      console.error("Error creating product:", error);
      next(error);
    }
  }

  // Get all products (Public)
  async getAllProducts(req, res, next) {
    try {
      const { page = 1, limit = 20, ...filters } = req.query;
      const result = await productService.getAllProducts(
        filters,
        parseInt(page),
        parseInt(limit),
      );
      res
        .status(200)
        .json(ApiResponse.success("Products fetched successfully", result));
    } catch (error) {
      next(error);
    }
  }

  // Get product by slug (Public)
  async getProductBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const result = await productService.getProductBySlug(slug);
      res
        .status(200)
        .json(ApiResponse.success("Product fetched successfully", result));
    } catch (error) {
      next(error);
    }
  }

  // Get product by ID
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await productService.getProductById(id);
      res
        .status(200)
        .json(ApiResponse.success("Product fetched successfully", result));
    } catch (error) {
      next(error);
    }
  }

  // Update product
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const { images, ...productData } = req.body;
      const isAdmin =
        req.user.role === "super_admin" || req.user.role === "sub_admin";

      let processedImages = [];
      if (images && images.length > 0) {
        for (const img of images) {
          if (img.url && img.url.startsWith("data:image")) {
            const uploaded = await uploadService.saveBase64Image(
              img.url,
              "products",
            );
            processedImages.push({
              url: uploaded.url,
              publicId: uploaded.publicId,
              isMain: img.isMain || false,
              displayOrder: img.displayOrder || 0,
            });
          } else if (img.url) {
            processedImages.push({
              url: img.url,
              publicId:
                img.publicId ||
                `product_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              isMain: img.isMain || false,
              displayOrder: img.displayOrder || 0,
            });
          }
        }
      }

      const updatePayload = { ...productData };
      if (images !== undefined) {
        updatePayload.images = processedImages;
      }
      // 🔥 FIX: Preserve variants
      if (productData.variants !== undefined) {
        updatePayload.variants = productData.variants;
      }
      if (productData.hasVariants !== undefined) {
        updatePayload.hasVariants = productData.hasVariants;
      }

      const result = await productService.updateProduct(
        id,
        updatePayload,
        req.user._id,
        isAdmin,
      );
      res
        .status(200)
        .json(ApiResponse.success("Product updated successfully", result));
    } catch (error) {
      console.error("Error updating product:", error);
      next(error);
    }
  }

  // Delete product
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const isAdmin =
        req.user.role === "super_admin" || req.user.role === "sub_admin";
      await productService.deleteProduct(id, req.user._id, isAdmin);
      res.status(200).json(ApiResponse.success("Product deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  // Update product status
  async updateProductStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;
      const isAdmin =
        req.user.role === "super_admin" || req.user.role === "sub_admin";
      const product = await productService.updateProductStatus(
        id,
        status,
        req.user._id,
        isAdmin,
        rejectionReason,
      );
      res.status(200).json(
        ApiResponse.success("Product status updated successfully", {
          product,
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  // Get vendor products
  async getVendorProducts(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await productService.getVendorProducts(
        req.user._id,
        parseInt(page),
        parseInt(limit),
      );
      res
        .status(200)
        .json(
          ApiResponse.success("Vendor products fetched successfully", result),
        );
    } catch (error) {
      next(error);
    }
  }

  // Get featured products (Public)
  async getFeaturedProducts(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 8;
      const products = await productService.getFeaturedProducts(limit);
      res.status(200).json(
        ApiResponse.success("Featured products fetched successfully", {
          products,
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  // Get products by category (Public)
  async getProductsByCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const result = await productService.getProductsByCategory(
        categoryId,
        parseInt(page),
        parseInt(limit),
      );
      res
        .status(200)
        .json(ApiResponse.success("Products fetched successfully", result));
    } catch (error) {
      next(error);
    }
  }

  // Search products (Public)
  async searchProducts(req, res, next) {
    try {
      const { q, page = 1, limit = 20 } = req.query;
      if (!q) {
        throw new ApiError(400, "Search term is required");
      }
      const result = await productService.searchProducts(
        q,
        parseInt(page),
        parseInt(limit),
      );
      res
        .status(200)
        .json(
          ApiResponse.success("Search results fetched successfully", result),
        );
    } catch (error) {
      next(error);
    }
  }

  // ==================== VARIANT CRUD ====================

  // Create variant
  async createVariant(req, res, next) {
    try {
      const { productId } = req.params;
      const isAdmin =
        req.user.role === "super_admin" || req.user.role === "sub_admin";
      const variant = await variantService.createVariant(
        productId,
        req.body,
        req.user._id,
        isAdmin,
      );
      res
        .status(201)
        .json(ApiResponse.success("Variant created successfully", { variant }));
    } catch (error) {
      next(error);
    }
  }

  // Get variants by product
  async getVariantsByProduct(req, res, next) {
    try {
      const { productId } = req.params;
      const variants = await variantService.getVariantsByProduct(productId);
      res
        .status(200)
        .json(
          ApiResponse.success("Variants fetched successfully", { variants }),
        );
    } catch (error) {
      next(error);
    }
  }

  // Get variant by ID
  async getVariantById(req, res, next) {
    try {
      const { variantId } = req.params;
      const variant = await variantService.getVariantById(variantId);
      res
        .status(200)
        .json(ApiResponse.success("Variant fetched successfully", { variant }));
    } catch (error) {
      next(error);
    }
  }

  // Update variant
  async updateVariant(req, res, next) {
    try {
      const { variantId } = req.params;
      const isAdmin =
        req.user.role === "super_admin" || req.user.role === "sub_admin";
      const variant = await variantService.updateVariant(
        variantId,
        req.body,
        req.user._id,
        isAdmin,
      );
      res
        .status(200)
        .json(ApiResponse.success("Variant updated successfully", { variant }));
    } catch (error) {
      next(error);
    }
  }

  // Delete variant
  async deleteVariant(req, res, next) {
    try {
      const { variantId } = req.params;
      const isAdmin =
        req.user.role === "super_admin" || req.user.role === "sub_admin";
      await variantService.deleteVariant(variantId, req.user._id, isAdmin);
      res.status(200).json(ApiResponse.success("Variant deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  // Toggle variant status
  async toggleVariantStatus(req, res, next) {
    try {
      const { variantId } = req.params;
      const isAdmin =
        req.user.role === "super_admin" || req.user.role === "sub_admin";
      const variant = await variantService.toggleVariantStatus(
        variantId,
        req.user._id,
        isAdmin,
      );
      res.status(200).json(
        ApiResponse.success("Variant status updated successfully", {
          variant,
        }),
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
