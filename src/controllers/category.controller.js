const categoryService = require('../services/category.service');
const uploadService = require('../services/upload.service');
const ApiResponse = require('../utils/ApiResponse');

class CategoryController {
  // Create category
  async createCategory(req, res, next) {
    try {
      const { image, ...categoryData } = req.body;
      
      let imageUrl = null;
      
      // ✅ If image is base64, save to server and get full URL
      if (image && image.startsWith('data:image')) {
        const uploaded = await uploadService.saveBase64Image(image, 'categories');
        imageUrl = uploaded.url; // ✅ Full URL now (http://localhost:5000/uploads/categories/xxx.jpg)
      }

      // ✅ Pass full URL to service
      const category = await categoryService.createCategory(
        { ...categoryData, image: imageUrl },
        req.user._id,
        req.user.role
      );
      
      res.status(201).json(
        ApiResponse.success('Category created successfully', { category })
      );
    } catch (error) {
      console.error('Error creating category:', error);
      next(error);
    }
  }

  // Get all categories (Public - tree structure)
  async getAllCategories(req, res, next) {
    try {
      const categories = await categoryService.getAllCategories();
      res.status(200).json(
        ApiResponse.success('Categories fetched successfully', { categories })
      );
    } catch (error) {
      next(error);
    }
  }

  // Get all categories flat (for admin panel)
  async getAllCategoriesFlat(req, res, next) {
    try {
      const categories = await categoryService.getAllCategoriesFlat(
        req.user.role,
        req.user._id
      );
      res.status(200).json(
        ApiResponse.success('Categories fetched successfully', { categories })
      );
    } catch (error) {
      next(error);
    }
  }

  // Get category by slug (Public)
  async getCategoryBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const category = await categoryService.getCategoryBySlug(slug);
      res.status(200).json(
        ApiResponse.success('Category fetched successfully', { category })
      );
    } catch (error) {
      next(error);
    }
  }

  // Get category by ID (with permission check)
  async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoryService.getCategoryById(
        id,
        req.user.role,
        req.user._id
      );
      res.status(200).json(
        ApiResponse.success('Category fetched successfully', { category })
      );
    } catch (error) {
      next(error);
    }
  }

  // Update category (with permission check)
  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { image, ...updateData } = req.body;
      
      // ✅ Handle image update with full URL
      if (image && image.startsWith('data:image')) {
        const uploaded = await uploadService.saveBase64Image(image, 'categories');
        updateData.image = uploaded.url; // ✅ Full URL
      }

      const category = await categoryService.updateCategory(
        id, 
        updateData, 
        req.user.role,
        req.user._id
      );
      res.status(200).json(
        ApiResponse.success('Category updated successfully', { category })
      );
    } catch (error) {
      next(error);
    }
  }

  // Delete category (with permission check)
  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      await categoryService.deleteCategory(id, req.user.role, req.user._id);
      res.status(200).json(
        ApiResponse.success('Category deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  // Get featured categories (Public)
  async getFeaturedCategories(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 6;
      const categories = await categoryService.getFeaturedCategories(limit);
      res.status(200).json(
        ApiResponse.success('Featured categories fetched successfully', { categories })
      );
    } catch (error) {
      next(error);
    }
  }

  // Get vendor categories
  async getVendorCategories(req, res, next) {
    try {
      const categories = await categoryService.getVendorCategories(req.user._id);
      res.status(200).json(
        ApiResponse.success('Vendor categories fetched successfully', { categories })
      );
    } catch (error) {
      next(error);
    }
  }

  // Toggle category status (with permission check)
  async toggleCategoryStatus(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoryService.toggleCategoryStatus(
        id,
        req.user.role,
        req.user._id
      );
      res.status(200).json(
        ApiResponse.success('Category status updated successfully', { category })
      );
    } catch (error) {
      next(error);
    }
  }

  // Get category hierarchy (breadcrumb)
  async getCategoryHierarchy(req, res, next) {
    try {
      const { id } = req.params;
      const breadcrumb = await categoryService.getCategoryHierarchy(id);
      res.status(200).json(
        ApiResponse.success('Category hierarchy fetched successfully', { breadcrumb })
      );
    } catch (error) {
      next(error);
    }
  }

  // Get categories by level
  async getCategoriesByLevel(req, res, next) {
    try {
      const { level } = req.params;
      const categories = await categoryService.getCategoriesByLevel(parseInt(level));
      res.status(200).json(
        ApiResponse.success('Categories fetched successfully', { categories })
      );
    } catch (error) {
      next(error);
    }
  }

  // Get category tree for a specific parent
  async getCategoryTree(req, res, next) {
    try {
      const { parentId } = req.params;
      const categories = await categoryService.getCategoryTree(parentId || null);
      res.status(200).json(
        ApiResponse.success('Category tree fetched successfully', { categories })
      );
    } catch (error) {
      next(error);
    }
  }

  // Bulk update display order (Admin only)
  async bulkUpdateDisplayOrder(req, res, next) {
    try {
      const { updates } = req.body;
      await categoryService.bulkUpdateDisplayOrder(updates);
      res.status(200).json(
        ApiResponse.success('Display order updated successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  // Get category statistics (Admin only)
  async getCategoryStats(req, res, next) {
    try {
      const stats = await categoryService.getCategoryStats();
      res.status(200).json(
        ApiResponse.success('Category stats fetched successfully', stats)
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();