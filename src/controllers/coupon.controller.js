const couponService = require('../services/coupon.service');
const ApiResponse = require('../utils/ApiResponse');

class CouponController {
  async createCoupon(req, res, next) {
    try {
      const coupon = await couponService.createCoupon(req.body, req.user._id);
      res.status(201).json(
        ApiResponse.success('Coupon created successfully', { coupon })
      );
    } catch (error) {
      next(error);
    }
  }

  async getAllCoupons(req, res, next) {
    try {
      const { page = 1, limit = 20, isActive, search } = req.query;
      const result = await couponService.getAllCoupons(parseInt(page), parseInt(limit), { isActive, search });
      res.status(200).json(
        ApiResponse.success('Coupons fetched successfully', result)
      );
    } catch (error) {
      next(error);
    }
  }

  async getCouponById(req, res, next) {
    try {
      const { id } = req.params;
      const coupon = await couponService.getCouponById(id);
      res.status(200).json(
        ApiResponse.success('Coupon fetched successfully', { coupon })
      );
    } catch (error) {
      next(error);
    }
  }

  async getCouponByCode(req, res, next) {
    try {
      const { code } = req.params;
      const coupon = await couponService.getCouponByCode(code);
      res.status(200).json(
        ApiResponse.success('Coupon fetched successfully', { coupon })
      );
    } catch (error) {
      next(error);
    }
  }

  async updateCoupon(req, res, next) {
    try {
      const { id } = req.params;
      const coupon = await couponService.updateCoupon(id, req.body);
      res.status(200).json(
        ApiResponse.success('Coupon updated successfully', { coupon })
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteCoupon(req, res, next) {
    try {
      const { id } = req.params;
      await couponService.deleteCoupon(id);
      res.status(200).json(
        ApiResponse.success('Coupon deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async toggleCouponStatus(req, res, next) {
    try {
      const { id } = req.params;
      const coupon = await couponService.toggleCouponStatus(id);
      res.status(200).json(
        ApiResponse.success('Coupon status updated successfully', { coupon })
      );
    } catch (error) {
      next(error);
    }
  }

  async getActiveCoupons(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const coupons = await couponService.getActiveCoupons(limit);
      res.status(200).json(
        ApiResponse.success('Active coupons fetched successfully', { coupons })
      );
    } catch (error) {
      next(error);
    }
  }

  async getExpiredCoupons(req, res, next) {
    try {
      const coupons = await couponService.getExpiredCoupons();
      res.status(200).json(
        ApiResponse.success('Expired coupons fetched successfully', { coupons })
      );
    } catch (error) {
      next(error);
    }
  }

  async getVendorCoupons(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await couponService.getVendorCoupons(req.user._id, parseInt(page), parseInt(limit));
      res.status(200).json(
        ApiResponse.success('Vendor coupons fetched successfully', result)
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CouponController();