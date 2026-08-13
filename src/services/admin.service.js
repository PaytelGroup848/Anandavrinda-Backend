const User = require('../models/User.model');
const Order = require('../models/order.model');
const Product = require('../models/Products.model');
const Category = require('../models/Categories.model');
const Session = require('../models/Session.model');
const Cart = require('../models/Cart.model');
const Review = require('../models/Review.model');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');

class AdminService {
  // ==================== DASHBOARD ====================
  async getDashboardStats() {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    
    const [totalUsers, totalOrders, totalProducts, todayOrders, pendingOrders] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ status: 'pending' }),
    ]);

    const totalRevenue = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    return {
      stats: {
        totalUsers,
        totalOrders,
        totalProducts,
        todayOrders,
        pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
      recentOrders: await Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
    };
  }

  // ==================== USER MANAGEMENT ====================
  async getAllUsers(page, limit, filters) {
    const query = {};
    if (filters.role) query.role = filters.role;
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);

    return { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getUserById(id) {
    const user = await User.findById(id).select('-password');
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }

 // Replace ONLY the createUser method in admin.service.js

async createUser(data) {
  const { name, email, phone, password, role = 'sub_admin', permissions = [] } = data;
  
  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(400, 'User with this email already exists');

  // ✅ Map short permissions to full permission format
  const permissionMap = {
    'categories': [
      'categories_view',
      'categories_create',
      'categories_edit',
      'categories_delete'
    ],
    'products': [
      'products_view',
      'products_create',
      'products_edit',
      'products_delete'
    ],
    'orders': [
      'orders_view',
      'orders_edit'
    ],
    'customers': [
      'customers_view',
      'customers_edit'
    ],
  };

  let mappedPermissions = [];
  for (const perm of permissions) {
    if (permissionMap[perm]) {
      mappedPermissions = [...mappedPermissions, ...permissionMap[perm]];
    } else {
      mappedPermissions.push(perm);
    }
  }

  // Remove duplicates
  mappedPermissions = [...new Set(mappedPermissions)];

  // Generate password if not provided
  let finalPassword = password;
  if (!finalPassword) {
    finalPassword = Math.random().toString(36).slice(-8);
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(finalPassword, salt);

  const user = await User.create({
    name,
    email,
    phone: phone || null,
    password: hashedPassword,
    role,
    permissions: mappedPermissions,
    status: 'active',
    isEmailVerified: true
  });

  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;

  return userResponse;
}

  async updateUserRole(id, role, adminId) {
    const user = await User.findById(id);
    if (!user) throw new ApiError(404, 'User not found');
    if (user.role === 'super_admin') throw new ApiError(403, 'Cannot change super admin role');
    user.role = role;
    await user.save();
    return user;
  }

  // ✅ User delete with related data cleanup
  async deleteUser(userId, adminId) {
    // Apne aap ko delete nahi kar sakta
    if (userId === adminId.toString()) {
      throw new ApiError(400, 'You cannot delete your own account');
    }

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    // Super admin delete nahi hoga
    if (user.role === 'super_admin') {
      throw new ApiError(403, 'Super Admin cannot be deleted');
    }

    // Related data delete karo
    await Session.deleteMany({ user: userId });
    await Cart.deleteOne({ user: userId });
    await Review.deleteMany({ user: userId });
    
    // Orders soft delete — record rehna chahiye
    await Order.updateMany(
      { user: userId },
      { $set: { customerDeleted: true } }
    );


    // User delete karo
    await User.findByIdAndDelete(userId);

    return true;
  }

  // ==================== CATEGORY MANAGEMENT ====================
  async getAllCategories(page, limit, filters) {
    const query = {};
    if (filters.search) {
      query.name = { $regex: filters.search, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const [categories, total] = await Promise.all([
      Category.find(query)
        .populate('parent', 'name slug')
        .skip(skip)
        .limit(limit)
        .sort({ displayOrder: 1, name: 1 }),
      Category.countDocuments(query)
    ]);

    return { categories, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getCategoryById(id) {
    const category = await Category.findById(id).populate('parent', 'name slug');
    if (!category) throw new ApiError(404, 'Category not found');
    return category;
  }

  async createCategory(data, adminId) {
    const { name, description, parent, displayOrder, isFeatured, seo, image } = data;
    
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existingCategory) throw new ApiError(400, 'Category with this name already exists');

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    let level = 1;
    let ancestors = [];

    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) throw new ApiError(404, 'Parent category not found');
      level = parentCategory.level + 1;
      if (level > 4) throw new ApiError(400, 'Maximum category level (4) exceeded');
      ancestors = [...parentCategory.ancestors, {
        _id: parentCategory._id,
        name: parentCategory.name,
        slug: parentCategory.slug
      }];
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description || '',
      parent: parent || null,
      level,
      ancestors,
      image: image || null,
      displayOrder: displayOrder || 0,
      isFeatured: isFeatured || false,
      seo: seo || {},
      isActive: true,
      productCount: 0,
      createdBy: adminId,
      createdByRole: 'admin'
    });

    return category;
  }

  async updateCategory(id, data, adminId) {
    const category = await Category.findById(id);
    if (!category) throw new ApiError(404, 'Category not found');

    if (data.name && data.name !== category.name) {
      data.slug = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    return updatedCategory;
  }

  async deleteCategory(id, adminId) {
    const category = await Category.findById(id);
    if (!category) throw new ApiError(404, 'Category not found');

    const childrenCount = await Category.countDocuments({ parent: id });
    if (childrenCount > 0) {
      throw new ApiError(400, 'Cannot delete category with subcategories');
    }

    if (category.productCount > 0) {
      throw new ApiError(400, 'Cannot delete category with products');
    }

    await category.deleteOne();
    return true;
  }

  // ==================== PRODUCT MANAGEMENT ====================
  async getAllProducts(page, limit, filters) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Product.countDocuments(query)
    ]);

    return { products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getProductById(id) {
    const product = await Product.findById(id)
      .populate('category', 'name')
    if (!product) throw new ApiError(404, 'Product not found');
    return product;
  }

  async createProduct(data, adminId) {
    const product = await Product.create({
      ...data,
      createdBy: adminId,
      isAdminProduct: true,
      status: 'active'
    });
    return product;
  }

  async updateProduct(id, data, adminId) {
    const product = await Product.findById(id);
    if (!product) throw new ApiError(404, 'Product not found');
    
    const updatedProduct = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    return updatedProduct;
  }

  async deleteProduct(id, adminId) {
    const product = await Product.findById(id);
    if (!product) throw new ApiError(404, 'Product not found');
    await product.deleteOne();
    return true;
  }

  async updateProductStatus(id, status, rejectionReason, adminId) {
    const product = await Product.findById(id);
    if (!product) throw new ApiError(404, 'Product not found');
    product.status = status;
    if (rejectionReason) product.rejectionReason = rejectionReason;
    await product.save();
    return product;
  }

  // ==================== ORDER MANAGEMENT ====================
  async getAllOrders(page, limit, filters) {
    const query = {};
    if (filters.status) query.status = filters.status;

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Order.countDocuments(query)
    ]);

    return { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getOrderById(id) {
    const order = await Order.findById(id)
      .populate('user', 'name email')
    if (!order) throw new ApiError(404, 'Order not found');
    return order;
  }

  async updateOrderStatus(id, status, adminId) {
    const order = await Order.findById(id);
    if (!order) throw new ApiError(404, 'Order not found');
    order.status = status;
    order.orderStatusHistory.push({
      status,
      message: `Order status updated to ${status}`,
      updatedBy: adminId,
      createdAt: new Date()
    });
    await order.save();
    return order;
  }

  // ==================== CUSTOMER MANAGEMENT ====================
  async getAllCustomers(page, limit, filters) {
    const query = { role: 'customer' };
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [customers, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);

    return { customers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getCustomerById(id) {
    const customer = await User.findById(id).select('-password');
    if (!customer) throw new ApiError(404, 'Customer not found');
    return customer;
  }

  async updateCustomer(id, data, adminId) {
    const customer = await User.findById(id);
    if (!customer) throw new ApiError(404, 'Customer not found');
    
    const allowedUpdates = ['name', 'phone', 'status'];
    const updates = {};
    for (const field of allowedUpdates) {
      if (data[field] !== undefined) {
        updates[field] = data[field];
      }
    }
    
    const updatedCustomer = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    return updatedCustomer;
  }
}

module.exports = new AdminService();