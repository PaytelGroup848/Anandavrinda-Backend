const Category = require('../models/Categories.model');
const ApiError = require('../utils/ApiError');

class CategoryService {
  // Create slug from name
  generateSlug(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Create category with full schema support
  async createCategory(categoryData, userId, userRole) {
    const {
      name,
      description,
      parent,
      image,
      displayOrder,
      isFeatured,
      seo,
    } = categoryData;

    // ─── VALIDATION ───────────────────────────────────────
    if (!name || !name.trim()) {
      throw new ApiError(400, 'Category name is required');
    }

    // Check if category exists
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
    if (existingCategory) {
      throw new ApiError(400, 'Category with this name already exists');
    }

    // Generate slug
    const slug = this.generateSlug(name);

    // Check if slug exists
    const existingSlug = await Category.findOne({ slug });
    if (existingSlug) {
      throw new ApiError(400, 'Category with this slug already exists');
    }

    let level = 1;
    let ancestors = [];

    // Handle parent category
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        throw new ApiError(404, 'Parent category not found');
      }

      level = parentCategory.level + 1;

      if (level > 4) {
        throw new ApiError(400, 'Maximum category level (4) exceeded');
      }

      ancestors = [
        ...parentCategory.ancestors,
        {
          _id: parentCategory._id,
          name: parentCategory.name,
          slug: parentCategory.slug,
        },
      ];
    }

    // ─── HANDLE IMAGE ────────────────────────────────────
    let imageObj = null;
    if (image) {
      // If image is base64 string
      if (typeof image === 'string' && image.startsWith('data:image')) {
        imageObj = {
          url: image,
          publicId: `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
      } 
      // If image is already an object
      else if (typeof image === 'object' && image.url) {
        imageObj = {
          url: image.url,
          publicId: image.publicId || `category_${Date.now()}`,
        };
      }
      // If image is a URL string
      else if (typeof image === 'string' && image.startsWith('http')) {
        imageObj = {
          url: image,
          publicId: `category_${Date.now()}`,
        };
      }
    }

    // ─── CREATE CATEGORY ──────────────────────────────────
    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description || '',
      parent: parent || null,
      level,
      ancestors,
      image: imageObj,
      displayOrder: displayOrder || 0,
      isFeatured: isFeatured || false,
      seo: {
        metaTitle: seo?.metaTitle || '',
        metaDescription: seo?.metaDescription || '',
        keywords: seo?.keywords || [],
      },
      isActive: true,
      productCount: 0,
      createdBy: userId,
      createdByRole: userRole,
    });

    return category;
  }

  // Get all categories with tree structure
  async getAllCategories() {
    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .populate('createdBy', 'name email');

    // Build tree structure
    const categoryMap = {};
    const roots = [];

    categories.forEach((category) => {
      categoryMap[category._id] = { ...category.toObject(), children: [] };
    });

    categories.forEach((category) => {
      const categoryObj = categoryMap[category._id];
      if (category.parent && categoryMap[category.parent]) {
        categoryMap[category.parent].children.push(categoryObj);
      } else {
        roots.push(categoryObj);
      }
    });

    return roots;
  }

  // Get all categories flat (for admin panel)
  async getAllCategoriesFlat(userRole, userId) {
    let query = {};

    // If vendor, only show categories created by them or public ones
    if (userRole === 'vendor') {
      query = {
        $or: [{ createdBy: userId }, { createdByRole: { $in: ['super_admin', 'sub_admin'] } }],
      };
    }

    const categories = await Category.find(query)
      .populate('parent', 'name slug')
      .populate('createdBy', 'name email')
      .sort({ level: 1, displayOrder: 1, name: 1 });

    return categories;
  }

  // Get category by slug (Public)
  async getCategoryBySlug(slug) {
    const category = await Category.findOne({ slug, isActive: true })
      .populate('parent', 'name slug')
      .populate('createdBy', 'name email');

    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    return category;
  }

  // Get category by ID (with permission check)
  async getCategoryById(id, userRole, userId) {
    const category = await Category.findById(id)
      .populate('parent', 'name slug')
      .populate('createdBy', 'name email');

    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    // Check permission for vendor
    if (userRole === 'vendor' && category.createdBy?._id?.toString() !== userId) {
      throw new ApiError(403, 'You can only view categories you created');
    }

    return category;
  }

  // Update category (with permission check)
  async updateCategory(id, updateData, userRole, userId) {
    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    // Check permission - Vendor can only update their own categories
    if (userRole === 'vendor' && category.createdBy?.toString() !== userId) {
      throw new ApiError(403, 'You can only update categories you created');
    }

    // If name is being updated, update slug too
    if (updateData.name && updateData.name !== category.name) {
      updateData.slug = this.generateSlug(updateData.name);

      const existingSlug = await Category.findOne({
        slug: updateData.slug,
        _id: { $ne: id },
      });
      if (existingSlug) {
        throw new ApiError(400, 'Category with this slug already exists');
      }
    }

    // If parent is being changed
    if (updateData.parent !== undefined && updateData.parent !== category.parent) {
      if (updateData.parent === null) {
        updateData.level = 1;
        updateData.ancestors = [];
      } else {
        const parentCategory = await Category.findById(updateData.parent);
        if (!parentCategory) {
          throw new ApiError(404, 'Parent category not found');
        }

        updateData.level = parentCategory.level + 1;

        if (updateData.level > 4) {
          throw new ApiError(400, 'Maximum category level (4) exceeded');
        }

        updateData.ancestors = [
          ...parentCategory.ancestors,
          {
            _id: parentCategory._id,
            name: parentCategory.name,
            slug: parentCategory.slug,
          },
        ];
      }
    }

    // ✅ Handle image update
    if (updateData.image) {
      if (typeof updateData.image === 'string' && updateData.image.startsWith('data:image')) {
        updateData.image = {
          url: updateData.image,
          publicId: `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
      } else if (typeof updateData.image === 'string' && updateData.image.startsWith('http')) {
        updateData.image = {
          url: updateData.image,
          publicId: `category_${Date.now()}`,
        };
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return updatedCategory;
  }

  // Delete category (with permission check)
  async deleteCategory(id, userRole, userId) {
    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    // Check permission - Vendor can only delete their own categories
    if (userRole === 'vendor' && category.createdBy?.toString() !== userId) {
      throw new ApiError(403, 'You can only delete categories you created');
    }

    // Check if category has children
    const childrenCount = await Category.countDocuments({ parent: id });
    if (childrenCount > 0) {
      throw new ApiError(400, 'Cannot delete category with subcategories. Delete subcategories first.');
    }

    // Check if category has products
    if (category.productCount > 0) {
      throw new ApiError(400, 'Cannot delete category with products. Reassign products first.');
    }

    await category.deleteOne();
    return true;
  }

  // Get featured categories (Public)
  async getFeaturedCategories(limit = 6) {
    const categories = await Category.find({ isActive: true, isFeatured: true })
      .limit(limit)
      .sort({ displayOrder: 1, name: 1 });

    return categories;
  }

  // Get categories by vendor
  async getVendorCategories(vendorId) {
    const categories = await Category.find({
      createdBy: vendorId,
      isActive: true,
    }).sort({ createdAt: -1 });

    return categories;
  }

  // Update product count for a category
  async updateProductCount(categoryId) {
    const Product = require('../models/Products.model');
    const count = await Product.countDocuments({
      category: categoryId,
      status: 'active',
    });
    await Category.findByIdAndUpdate(categoryId, { productCount: count });
  }

  // Toggle category status (with permission check)
  async toggleCategoryStatus(id, userRole, userId) {
    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    if (userRole === 'vendor' && category.createdBy?.toString() !== userId) {
      throw new ApiError(403, 'You can only update categories you created');
    }

    category.isActive = !category.isActive;
    await category.save();

    return category;
  }

  // Get category hierarchy (breadcrumb)
  async getCategoryHierarchy(categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    const breadcrumb = [];
    let current = category;

    // Add ancestors
    if (current.ancestors && current.ancestors.length > 0) {
      for (const ancestor of current.ancestors) {
        breadcrumb.push(ancestor);
      }
    }

    // Add current category
    breadcrumb.push({
      _id: current._id,
      name: current.name,
      slug: current.slug,
    });

    return breadcrumb;
  }

  // Get categories by level
  async getCategoriesByLevel(level) {
    const categories = await Category.find({
      level,
      isActive: true,
    })
      .sort({ displayOrder: 1, name: 1 })
      .populate('parent', 'name slug');

    return categories;
  }

  // Get category tree for a specific parent
  async getCategoryTree(parentId = null) {
    const query = { isActive: true };
    if (parentId) {
      query.parent = parentId;
    } else {
      query.parent = null;
    }

    const categories = await Category.find(query)
      .sort({ displayOrder: 1, name: 1 })
      .populate('createdBy', 'name email');

    const result = [];
    for (const category of categories) {
      const children = await this.getCategoryTree(category._id);
      result.push({
        ...category.toObject(),
        children,
      });
    }

    return result;
  }

  // Bulk update display order
  async bulkUpdateDisplayOrder(updates) {
    const operations = updates.map(({ id, displayOrder }) => ({
      updateOne: {
        filter: { _id: id },
        update: { displayOrder },
      },
    }));

    if (operations.length > 0) {
      await Category.bulkWrite(operations);
    }

    return true;
  }

  // Get category statistics
  async getCategoryStats() {
    const totalCategories = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ isActive: true });
    const featuredCategories = await Category.countDocuments({ isFeatured: true });
    const topLevelCategories = await Category.countDocuments({ level: 1 });

    return {
      totalCategories,
      activeCategories,
      featuredCategories,
      topLevelCategories,
    };
  }
}

module.exports = new CategoryService();