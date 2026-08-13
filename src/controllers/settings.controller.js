const settingsService = require('../services/settings.service');
const ApiResponse = require('../utils/ApiResponse');

class SettingsController {
  // ─── General Settings ──────────────────────────────────
  async getSettings(req, res, next) {
    try {
      const settings = await settingsService.getSettings();
      res.status(200).json(
        ApiResponse.success('Settings fetched successfully', { settings })
      );
    } catch (error) {
      console.error('Error in getSettings:', error);
      // Return default settings instead of error
      res.status(200).json(
        ApiResponse.success('Settings fetched successfully', {
          settings: {
            maintenance: {
              isEnabled: false,
              message: 'We are under maintenance. Back soon!',
            },

            support: {
              email: '',
              phone: '',
            },

            billing: {
              companyName: '',
              address: '',
              city: '',
              state: '',
              pincode: '',
              country: 'India',
              email: '',
              phone: '',
              gstin: '',
              pan: '',
            },

            order: {
              freeShippingAbove: 999,
              defaultShippingCharge: 79,
              isCODEnabled: true,
              codCharge: 0,
              cancellationWindowHours: 24,
            },

            tax: {
              isGSTEnabled: true,
              defaultGSTRate: 18,
              gstNumber: '',
            },

            delivery: {
              partners: [],
            },
          }
        })
      );
    }
  }

  async updateSettings(req, res, next) {
    try {
      const settings = await settingsService.updateSettings(req.body, req.user._id);
      res.status(200).json(
        ApiResponse.success('Settings updated successfully', { settings })
      );
    } catch (error) {
      console.error('Error in updateSettings:', error);
      next(error);
    }
  }

  // ─── Vendor Settings ──────────────────────────────────
  async getVendorRegistrationStatus(req, res, next) {
    try {
      const status = await settingsService.getVendorRegistrationStatus();
      res.status(200).json(
        ApiResponse.success('Vendor registration status fetched', status)
      );
    } catch (error) {
      console.error('Error in getVendorRegistrationStatus:', error);
      res.status(200).json(
        ApiResponse.success('Vendor registration status fetched', {
          isEnabled: true,
          autoApprove: false,
          vendorApprovalRequired: true,
          defaultCommissionRate: 10,
          minWithdrawalAmount: 500,
        })
      );
    }
  }

  async updateVendorRegistration(req, res, next) {
    try {
      const { isEnabled } = req.body;
      const settings = await settingsService.updateVendorRegistration(isEnabled, req.user._id);
      res.status(200).json(
        ApiResponse.success('Vendor registration updated', { settings })
      );
    } catch (error) {
      console.error('Error in updateVendorRegistration:', error);
      next(error);
    }
  }

  async updateVendorApproval(req, res, next) {
    try {
      const { approvalRequired } = req.body;
      const settings = await settingsService.updateVendorApproval(approvalRequired, req.user._id);
      res.status(200).json(
        ApiResponse.success('Vendor approval setting updated', { settings })
      );
    } catch (error) {
      console.error('Error in updateVendorApproval:', error);
      next(error);
    }
  }

  async updateVendorAutoApprove(req, res, next) {
    try {
      const { autoApprove } = req.body;
      const settings = await settingsService.updateVendorAutoApprove(autoApprove, req.user._id);
      res.status(200).json(
        ApiResponse.success('Vendor auto approve updated', { settings })
      );
    } catch (error) {
      console.error('Error in updateVendorAutoApprove:', error);
      next(error);
    }
  }

  async updateVendorCommission(req, res, next) {
    try {
      const { rate } = req.body;
      const settings = await settingsService.updateVendorCommission(rate, req.user._id);
      res.status(200).json(
        ApiResponse.success('Vendor commission updated', { settings })
      );
    } catch (error) {
      console.error('Error in updateVendorCommission:', error);
      next(error);
    }
  }

  // ─── Order Settings ──────────────────────────────────
  async getOrderSettings(req, res, next) {
    try {
      const settings = await settingsService.getOrderSettings();
      res.status(200).json(
        ApiResponse.success('Order settings fetched', settings)
      );
    } catch (error) {
      console.error('Error in getOrderSettings:', error);
      res.status(200).json(
        ApiResponse.success('Order settings fetched', {
          freeShippingAbove: 999,
          defaultShippingCharge: 79,
          isCODEnabled: true,
          codCharge: 0,
          cancellationWindowHours: 24,
          returnWindowDays: 7,
        })
      );
    }
  }

  async updateOrderSettings(req, res, next) {
    try {
      const settings = await settingsService.updateOrderSettings(req.body, req.user._id);
      res.status(200).json(
        ApiResponse.success('Order settings updated', { settings })
      );
    } catch (error) {
      console.error('Error in updateOrderSettings:', error);
      next(error);
    }
  }

  // ─── Tax Settings ──────────────────────────────────
  async getTaxSettings(req, res, next) {
    try {
      const settings = await settingsService.getTaxSettings();
      res.status(200).json(
        ApiResponse.success('Tax settings fetched', settings)
      );
    } catch (error) {
      console.error('Error in getTaxSettings:', error);
      res.status(200).json(
        ApiResponse.success('Tax settings fetched', {
          isGSTEnabled: true,
          defaultGSTRate: 18,
          gstNumber: '',
        })
      );
    }
  }

  async updateTaxSettings(req, res, next) {
    try {
      const settings = await settingsService.updateTaxSettings(req.body, req.user._id);
      res.status(200).json(
        ApiResponse.success('Tax settings updated', { settings })
      );
    } catch (error) {
      console.error('Error in updateTaxSettings:', error);
      next(error);
    }
  }

  // ─── Commission Settings ──────────────────────────────────
  async getCommissionSettings(req, res, next) {
    try {
      const settings = await settingsService.getCommissionSettings();
      res.status(200).json(
        ApiResponse.success('Commission settings fetched', settings)
      );
    } catch (error) {
      console.error('Error in getCommissionSettings:', error);
      res.status(200).json(
        ApiResponse.success('Commission settings fetched', {
          globalRate: 10,
          minWithdrawalAmount: 500,
        })
      );
    }
  }

  async updateCommissionSettings(req, res, next) {
    try {
      const settings = await settingsService.updateCommissionSettings(req.body, req.user._id);
      res.status(200).json(
        ApiResponse.success('Commission settings updated', { settings })
      );
    } catch (error) {
      console.error('Error in updateCommissionSettings:', error);
      next(error);
    }
  }

  // ─── Store Info ──────────────────────────────────
  async getStoreInfo(req, res, next) {
    try {
      const storeInfo = await settingsService.getStoreInfo();
      res.status(200).json(
        ApiResponse.success('Store info fetched', { storeInfo })
      );
    } catch (error) {
      console.error('Error in getStoreInfo:', error);
      res.status(200).json(
        ApiResponse.success('Store info fetched', {
          storeInfo: { name: 'My eCommerce Store', email: '', phone: '', address: '', currency: 'INR', currencySymbol: '₹' }
        })
      );
    }
  }

  // ─── Maintenance ──────────────────────────────────
  async checkMaintenance(req, res, next) {
    try {
      const maintenance = await settingsService.isMaintenanceMode();
      res.status(200).json(
        ApiResponse.success('Maintenance status fetched', maintenance)
      );
    } catch (error) {
      console.error('Error in checkMaintenance:', error);
      res.status(200).json(
        ApiResponse.success('Maintenance status fetched', {
          isEnabled: false,
          message: 'We are under maintenance. Back soon!',
        })
      );
    }
  }
}

module.exports = new SettingsController();