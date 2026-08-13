const adminService = require('../services/admin.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

class AdminController {
  // ==================== DASHBOARD ====================
  async getDashboardStats(req, res, next) {
    try {
      // Check if user is sub-admin
      if (req.user.role === 'sub_admin') {
        throw new ApiError(403, 'Access denied. Dashboard is only for super admin.');
      }
      const stats = await adminService.getDashboardStats();
      res.status(200).json(
        ApiResponse.success('Dashboard stats fetched successfully', stats)
      );
    } catch (error) {
      next(error);
    }
  }

  // ==================== VENDOR MANAGEMENT ====================
  async getAllVendors(req, res, next) {
    try {
      // Sub-admin cannot access vendors
      if (req.user.role === 'sub_admin') {
        throw new ApiError(403, 'Access denied. Vendors management is only for super admin.');
      }
      const { page = 1, limit = 20, status, search } = req.query;
      const result = await adminService.getAllVendors(parseInt(page), parseInt(limit), { status, search });
      res.status(200).json(
        ApiResponse.success('Vendors fetched successfully', result)
      );
    } catch (error) {
      next(error);
    }
  }

  async getVendorById(req, res, next) {
    try {
      // Sub-admin cannot access vendors
      if (req.user.role === 'sub_admin') {
        throw new ApiError(403, 'Access denied. Vendors management is only for super admin.');
      }
      const { id } = req.params;
      const vendor = await adminService.getVendorById(id);
      res.status(200).json(
        ApiResponse.success('Vendor fetched successfully', { vendor })
      );
    } catch (error) {
      next(error);
    }
  }

  async createVendor(req, res, next) {
    try {
      // Sub-admin cannot create vendors
      if (req.user.role === 'sub_admin') {
        throw new ApiError(403, 'Access denied. Vendors management is only for super admin.');
      }
      const vendor = await adminService.createVendor(req.body);
      res.status(201).json(
        ApiResponse.success('Vendor created successfully', { vendor })
      );
    } catch (error) {
      next(error);
    }
  }

  async approveVendor(req, res, next) {
    try {
      // Sub-admin cannot approve vendors
      if (req.user.role === 'sub_admin') {
        throw new ApiError(403, 'Access denied. Vendors management is only for super admin.');
      }
      const { id } = req.params;
      const vendor = await adminService.approveVendor(id, req.user._id);
      res.status(200).json(
        ApiResponse.success('Vendor approved successfully', { vendor })
      );
    } catch (error) {
      next(error);
    }
  }

  async rejectVendor(req, res, next) {
    try {
      // Sub-admin cannot reject vendors
      if (req.user.role === 'sub_admin') {
        throw new ApiError(403, 'Access denied. Vendors management is only for super admin.');
      }
      const { id } = req.params;
      const { reason } = req.body;
      const vendor = await adminService.rejectVendor(id, req.user._id, reason);
      res.status(200).json(
        ApiResponse.success('Vendor rejected successfully', { vendor })
      );
    } catch (error) {
      next(error);
    }
  }

  async suspendVendor(req, res, next) {
    try {
      // Sub-admin cannot suspend vendors
      if (req.user.role === 'sub_admin') {
        throw new ApiError(403, 'Access denied. Vendors management is only for super admin.');
      }
      const { id } = req.params;
      const { reason } = req.body;
      const vendor = await adminService.suspendVendor(id, req.user._id, reason);
      res.status(200).json(
        ApiResponse.success('Vendor suspended successfully', { vendor })
      );
    } catch (error) {
      next(error);
    }
  }

  async activateVendor(req, res, next) {
    try {
      // Sub-admin cannot activate vendors
      if (req.user.role === 'sub_admin') {
        throw new ApiError(403, 'Access denied. Vendors management is only for super admin.');
      }
      const { id } = req.params;
      const vendor = await adminService.activateVendor(id, req.user._id);
      res.status(200).json(
        ApiResponse.success('Vendor activated successfully', { vendor })
      );
    } catch (error) {
      next(error);
    }
  }

  // ==================== USER MANAGEMENT ====================
  async getAllUsers(req, res, next) {
    try {
      // Sub-admin cannot access users
      if (req.user.role === 'sub_admin') {
        throw new ApiError(403, 'Access denied. Users management is only for super admin.');
      }
      const { page = 1, limit = 20, role, status, search } = req.query;
      const result = await adminService.getAllUsers(parseInt(page), parseInt(limit), { role, status, search });
      res.status(200).json(
        ApiResponse.success('Users fetched successfully', result)
      );
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      // Sub-admin cannot access users
      if (req.user.role === 'sub_admin') {
        throw new ApiError(403, 'Access denied. Users management is only for super admin.');
      }
      const { id } = req.params;
      const user = await adminService.getUserById(id);
      res.status(200).json(
        ApiResponse.success('User fetched successfully', { user })
      );
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      // Sub-admin cannot create users
      if (req.user.role === 'sub_admin') {
        throw new ApiError(403, 'Access denied. Users management is only for super admin.');
      }
      const user = await adminService.createUser(req.body);
      res.status(201).json(
        ApiResponse.success('User created successfully', { user })
      );
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req, res, next) {
    try {
      // Sub-admin cannot update user roles
      if (req.user.role === 'sub_admin') {
        throw new ApiError(403, 'Access denied. Users management is only for super admin.');
      }
      const { id } = req.params;
      const { role } = req.body;
      const user = await adminService.updateUserRole(id, role, req.user._id);
      res.status(200).json(
        ApiResponse.success('User role updated successfully', { user })
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      // Sub-admin cannot delete users
      if (req.user.role === 'sub_admin') {
        throw new ApiError(403, 'Access denied. Users management is only for super admin.');
      }
      const { id } = req.params;
      await adminService.deleteUser(id, req.user._id);
      res.status(200).json(
        ApiResponse.success('User deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  // ==================== CATEGORY MANAGEMENT ====================
  async getAllCategories(req, res, next) {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const result = await adminService.getAllCategories(parseInt(page), parseInt(limit), { search });
      res.status(200).json(
        ApiResponse.success('Categories fetched successfully', result)
      );
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await adminService.getCategoryById(id);
      res.status(200).json(
        ApiResponse.success('Category fetched successfully', { category })
      );
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const category = await adminService.createCategory(req.body, req.user._id);
      res.status(201).json(
        ApiResponse.success('Category created successfully', { category })
      );
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const category = await adminService.updateCategory(id, req.body, req.user._id);
      res.status(200).json(
        ApiResponse.success('Category updated successfully', { category })
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      await adminService.deleteCategory(id, req.user._id);
      res.status(200).json(
        ApiResponse.success('Category deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  // ==================== PRODUCT MANAGEMENT ====================
  async getAllProducts(req, res, next) {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      const result = await adminService.getAllProducts(parseInt(page), parseInt(limit), { status, search });
      res.status(200).json(
        ApiResponse.success('Products fetched successfully', result)
      );
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await adminService.getProductById(id);
      res.status(200).json(
        ApiResponse.success('Product fetched successfully', { product })
      );
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const product = await adminService.createProduct(req.body, req.user._id);
      res.status(201).json(
        ApiResponse.success('Product created successfully', { product })
      );
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const product = await adminService.updateProduct(id, req.body, req.user._id);
      res.status(200).json(
        ApiResponse.success('Product updated successfully', { product })
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      await adminService.deleteProduct(id, req.user._id);
      res.status(200).json(
        ApiResponse.success('Product deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async updateProductStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;
      const product = await adminService.updateProductStatus(id, status, rejectionReason, req.user._id);
      res.status(200).json(
        ApiResponse.success('Product status updated successfully', { product })
      );
    } catch (error) {
      next(error);
    }
  }

  // ==================== ORDER MANAGEMENT ====================
  async getAllOrders(req, res, next) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const result = await adminService.getAllOrders(parseInt(page), parseInt(limit), { status });
      res.status(200).json(
        ApiResponse.success('Orders fetched successfully', result)
      );
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await adminService.getOrderById(id);
      res.status(200).json(
        ApiResponse.success('Order fetched successfully', { order })
      );
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await adminService.updateOrderStatus(id, status, req.user._id);
      res.status(200).json(
        ApiResponse.success('Order status updated successfully', { order })
      );
    } catch (error) {
      next(error);
    }
  }

  // ==================== CUSTOMER MANAGEMENT ====================
  async getAllCustomers(req, res, next) {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const result = await adminService.getAllCustomers(parseInt(page), parseInt(limit), { search });
      res.status(200).json(
        ApiResponse.success('Customers fetched successfully', result)
      );
    } catch (error) {
      next(error);
    }
  }

  async getCustomerById(req, res, next) {
    try {
      const { id } = req.params;
      const customer = await adminService.getCustomerById(id);
      res.status(200).json(
        ApiResponse.success('Customer fetched successfully', { customer })
      );
    } catch (error) {
      next(error);
    }
  }

  async updateCustomer(req, res, next) {
    try {
      const { id } = req.params;
      const customer = await adminService.updateCustomer(id, req.body, req.user._id);
      res.status(200).json(
        ApiResponse.success('Customer updated successfully', { customer })
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();