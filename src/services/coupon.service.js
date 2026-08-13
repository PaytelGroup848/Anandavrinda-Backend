const Coupon = require('../models/Coupon.model');
const ApiError = require('../utils/ApiError');

class CouponService {
  // Generate unique coupon code if not provided
  generateCouponCode(prefix = 'SAVE') {
    const randomNum = Math.floor(Math.random() * 10000);
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}${randomNum}${timestamp}`.toUpperCase();
  }

  // Create coupon
  async createCoupon(couponData, userId) {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount = 0,
      startDate,
      endDate,
      usageLimit = null,
      usageLimitPerUser = 1,
      applicableUsers = [],
      applicableProducts = [],
      applicableCategories = [],
      isActive = true
    } = couponData;

    // Generate code if not provided
    let finalCode = code;
    if (!finalCode) {
      finalCode = this.generateCouponCode();
    } else {
      finalCode = finalCode.toUpperCase().trim();
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: finalCode });
    if (existingCoupon) {
      throw new ApiError(400, 'Coupon code already exists');
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      throw new ApiError(400, 'End date must be after start date');
    }

    // Validate discount value
    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      throw new ApiError(400, 'Percentage discount must be between 0 and 100');
    }

    if (discountType === 'flat' && discountValue < 0) {
      throw new ApiError(400, 'Flat discount must be greater than 0');
    }

    // Create coupon
    const coupon = await Coupon.create({
      code: finalCode,
      description: description || null,
      discountType,
      discountValue,
      maxDiscountAmount: maxDiscountAmount || null,
      minOrderAmount,
      startDate: start,
      endDate: end,
      usageLimit: usageLimit || null,
      usageLimitPerUser: usageLimitPerUser || 1,
      applicableUsers: applicableUsers || [],
      applicableProducts: applicableProducts || [],
      applicableCategories: applicableCategories || [],
      createdBy: userId,
      isActive,
      usedCount: 0
    });

    return coupon;
  }

  // Get all coupons (Admin only)
  async getAllCoupons(page = 1, limit = 20, filters = {}) {
    const query = {};
    
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive === 'true';
    }
    
    if (filters.search) {
      query.code = { $regex: filters.search, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    
    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Coupon.countDocuments(query)
    ]);

    return {
      coupons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get coupon by ID
  async getCouponById(id) {
    const coupon = await Coupon.findById(id)
      .populate('createdBy', 'name email')
      .populate('applicableUsers', 'name email')
      .populate('applicableProducts', 'name price')
      .populate('applicableCategories', 'name slug');
    
    if (!coupon) {
      throw new ApiError(404, 'Coupon not found');
    }
    
    return coupon;
  }

  // Get coupon by code (Public - for validation)
  async getCouponByCode(code) {
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase().trim(),
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });
    
    if (!coupon) {
      throw new ApiError(404, 'Invalid or expired coupon code');
    }
    
    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new ApiError(400, 'Coupon usage limit exceeded');
    }
    
    return coupon;
  }

  // Validate coupon for user and cart
  async validateCoupon(code, userId, cartTotal, productIds = [], categoryIds = []) {
    const coupon = await this.getCouponByCode(code);
    
    // Check minimum order amount
    if (cartTotal < coupon.minOrderAmount) {
      throw new ApiError(400, `Minimum order amount of ₹${coupon.minOrderAmount} required`);
    }
    
    // Check if coupon is applicable to specific users
    if (coupon.applicableUsers && coupon.applicableUsers.length > 0) {
      const isUserApplicable = coupon.applicableUsers.some(
        id => id.toString() === userId.toString()
      );
      if (!isUserApplicable) {
        throw new ApiError(400, 'This coupon is not applicable to your account');
      }
    }
    
    // Check if coupon is applicable to specific products
    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      const isProductApplicable = productIds.some(
        pid => coupon.applicableProducts.some(
          cid => cid.toString() === pid.toString()
        )
      );
      if (!isProductApplicable) {
        throw new ApiError(400, 'This coupon is not applicable to the products in your cart');
      }
    }
    
    // Check if coupon is applicable to specific categories
    if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
      const isCategoryApplicable = categoryIds.some(
        cid => coupon.applicableCategories.some(
          ccid => ccid.toString() === cid.toString()
        )
      );
      if (!isCategoryApplicable) {
        throw new ApiError(400, 'This coupon is not applicable to the categories in your cart');
      }
    }
    
    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }
    
    return {
      coupon,
      discountAmount,
      finalTotal: cartTotal - discountAmount
    };
  }

  // Apply coupon (increment usage count)
  async applyCoupon(code, userId) {
    const coupon = await this.getCouponByCode(code);
    
    // Increment usage count
    coupon.usedCount += 1;
    await coupon.save();
    
    return coupon;
  }

  // Update coupon
  async updateCoupon(id, updateData) {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new ApiError(404, 'Coupon not found');
    }
    
    // If code is being updated, check uniqueness
    if (updateData.code && updateData.code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code: updateData.code.toUpperCase() });
      if (existingCoupon) {
        throw new ApiError(400, 'Coupon code already exists');
      }
      updateData.code = updateData.code.toUpperCase();
    }
    
    // Validate dates if both are provided
    if (updateData.startDate && updateData.endDate) {
      const start = new Date(updateData.startDate);
      const end = new Date(updateData.endDate);
      if (start > end) {
        throw new ApiError(400, 'End date must be after start date');
      }
    }
    
    // Validate discount value
    if (updateData.discountType === 'percentage' && updateData.discountValue) {
      if (updateData.discountValue < 0 || updateData.discountValue > 100) {
        throw new ApiError(400, 'Percentage discount must be between 0 and 100');
      }
    }
    
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    return updatedCoupon;
  }

  // Delete coupon
  async deleteCoupon(id) {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new ApiError(404, 'Coupon not found');
    }
    
    await coupon.deleteOne();
    return true;
  }

  // Toggle coupon status
  async toggleCouponStatus(id) {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new ApiError(404, 'Coupon not found');
    }
    
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    
    return coupon;
  }

  // Get active coupons (Public)
  async getActiveCoupons(limit = 10) {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    })
    .limit(limit)
    .sort({ createdAt: -1 });
    
    return coupons;
  }

  // Get expired coupons
  async getExpiredCoupons() {
    const now = new Date();
    const coupons = await Coupon.find({
      endDate: { $lt: now },
      isActive: true
    });
    
    return coupons;
  }

  // Get coupons by vendor
  async getVendorCoupons(vendorId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [coupons, total] = await Promise.all([
      Coupon.find({ createdBy: vendorId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Coupon.countDocuments({ createdBy: vendorId })
    ]);
    
    return {
      coupons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Auto-disable expired coupons
  async autoDisableExpiredCoupons() {
    const now = new Date();
    const result = await Coupon.updateMany(
      {
        endDate: { $lt: now },
        isActive: true
      },
      {
        isActive: false
      }
    );
    
    return result;
  }
}

module.exports = new CouponService();