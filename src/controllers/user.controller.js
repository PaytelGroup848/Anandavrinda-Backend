const userService = require('../services/user.service');
const ApiResponse = require('../utils/ApiResponse');

class UserController {
  // Get current user profile
  async getProfile(req, res, next) {
    try {
      const user = await userService.getProfile(req.user._id);
      res.status(200).json(
        ApiResponse.success('Profile fetched successfully', { user })
      );
    } catch (error) {
      next(error);
    }
  }

  // Update current user profile
  async updateProfile(req, res, next) {
    try {
      const user = await userService.updateProfile(req.user._id, req.body);
      res.status(200).json(
        ApiResponse.success('Profile updated successfully', { user })
      );
    } catch (error) {
      next(error);
    }
  }

  // Change password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await userService.changePassword(req.user._id, currentPassword, newPassword);
      res.status(200).json(
        ApiResponse.success('Password changed successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  // Get user addresses
  async getAddresses(req, res, next) {
    try {
      const addresses = await userService.getAddresses(req.user._id);
      res.status(200).json(
        ApiResponse.success('Addresses fetched successfully', { addresses })
      );
    } catch (error) {
      next(error);
    }
  }

  // Add address
  async addAddress(req, res, next) {
    try {
      const address = await userService.addAddress(req.user._id, req.body);
      res.status(201).json(
        ApiResponse.success('Address added successfully', { address })
      );
    } catch (error) {
      next(error);
    }
  }

  // Update address
  async updateAddress(req, res, next) {
    try {
      const { addressId } = req.params;
      const address = await userService.updateAddress(req.user._id, addressId, req.body);
      res.status(200).json(
        ApiResponse.success('Address updated successfully', { address })
      );
    } catch (error) {
      next(error);
    }
  }

  // Delete address
  async deleteAddress(req, res, next) {
    try {
      const { addressId } = req.params;
      await userService.deleteAddress(req.user._id, addressId);
      res.status(200).json(
        ApiResponse.success('Address deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  // Get user orders
  async getUserOrders(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await userService.getUserOrders(req.user._id, parseInt(page), parseInt(limit));
      res.status(200).json(
        ApiResponse.success('Orders fetched successfully', result)
      );
    } catch (error) {
      next(error);
    }
  }

  // Get user stats
  async getUserStats(req, res, next) {
    try {
      const stats = await userService.getUserStats(req.user._id);
      res.status(200).json(
        ApiResponse.success('User stats fetched successfully', stats)
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();