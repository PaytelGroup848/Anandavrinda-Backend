const User = require('../models/User.model');
const Order = require('../models/order.model');
const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');

class UserService {
  // Get user profile
  async getProfile(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }

  // Update user profile
  async updateProfile(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Allowed fields to update
    const allowedUpdates = ['name', 'phone', 'avatar', 'preferences'];
    const updates = {};

    for (const field of allowedUpdates) {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    return updatedUser;
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    return true;
  }

  // Get user addresses
  async getAddresses(userId) {
    const user = await User.findById(userId).select('addresses');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user.addresses || [];
  }

  // Add address
  async addAddress(userId, addressData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // If this is the first address or isDefault is true, set as default
    if (addressData.isDefault || user.addresses.length === 0) {
      // Remove default from all existing addresses
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
      addressData.isDefault = true;
    }

    user.addresses.push(addressData);
    await user.save();

    return user.addresses[user.addresses.length - 1];
  }

  // Update address
  async updateAddress(userId, addressId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      throw new ApiError(404, 'Address not found');
    }

    // Update address fields
    const allowedFields = ['label', 'fullName', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'pincode', 'country', 'isDefault'];
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        address[field] = updateData[field];
      }
    }

    // If setting this address as default, remove default from others
    if (updateData.isDefault) {
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== addressId) {
          addr.isDefault = false;
        }
      });
    }

    await user.save();
    return address;
  }

  // Delete address
  async deleteAddress(userId, addressId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      throw new ApiError(404, 'Address not found');
    }

    const wasDefault = address.isDefault;
    address.remove();

    // If deleted address was default and there are other addresses, set first as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return true;
  }

  // Get user orders
  async getUserOrders(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [orders, total] = await Promise.all([
      Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments({ user: userId })
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get user by ID (for admin)
  async getUserById(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }

  // Get all users (for admin)
  async getAllUsers(page = 1, limit = 20, filters = {}) {
    const query = {};
    
    if (filters.role) {
      query.role = filters.role;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Delete user (for admin)
  async deleteUser(userId, adminId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Prevent deleting super admin
    if (user.role === 'super_admin') {
      throw new ApiError(403, 'Cannot delete super admin');
    }
  
    
    // Delete user
    await user.deleteOne();
    
    return true;
  }

  // Update user role (for admin)
  async updateUserRole(userId, newRole, adminId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Prevent changing super admin role
    if (user.role === 'super_admin') {
      throw new ApiError(403, 'Cannot change super admin role');
    }
    
    user.role = newRole;
    await user.save();
    
    return user;
  }

  // Update user status (for admin)
  async updateUserStatus(userId, status, adminId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
   
    user.status = status;
    await user.save();
    
    return user;
  }

  // Get user statistics
  async getUserStats(userId) {
    const [totalOrders, totalSpent, wishlistCount] = await Promise.all([
      Order.countDocuments({ user: userId }),
      Order.aggregate([
        { $match: { user: userId, status: 'delivered' } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]),
      // Wishlist count - will implement when wishlist model is ready
      Promise.resolve(0)
    ]);

    return {
      totalOrders,
      totalSpent: totalSpent[0]?.total || 0,
      wishlistCount,
      memberSince: (await User.findById(userId)).createdAt
    };
  }

  // Get user by email
  async getUserByEmail(email) {
    const user = await User.findOne({ email }).select('-password');
    return user;
  }

  // Check if email exists
  async isEmailExists(email) {
    const user = await User.findOne({ email });
    return !!user;
  }

  // Update last login
  async updateLastLogin(userId, ipAddress) {
    await User.findByIdAndUpdate(userId, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress
    });
  }
}

module.exports = new UserService();