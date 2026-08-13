const PlatformSettings = require('../models/PlatformSettings.model');
const ApiError = require('../utils/ApiError');

// Simple in-memory cache without external dependency
class SimpleCache {
  constructor() {
    this.cache = {};
  }

  get(key) {
    const item = this.cache[key];
    if (!item) return null;
    if (Date.now() > item.expiry) {
      delete this.cache[key];
      return null;
    }
    return item.value;
  }

  set(key, value, ttlSeconds = 300) {
    this.cache[key] = {
      value,
      expiry: Date.now() + (ttlSeconds * 1000)
    };
  }

  del(key) {
    delete this.cache[key];
  }
}

const settingsCache = new SimpleCache();

class SettingsService {
  // Get settings with caching
  async getSettings() {
    const cacheKey = 'platform_settings';
    let settings = settingsCache.get(cacheKey);
    
    if (settings) {
      return settings;
    }

    settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({ key: 'platform_settings' });
    }
    
    settingsCache.set(cacheKey, settings);
    return settings;
  }

  // Update settings and clear cache
  async updateSettings(updateData, userId) {
    try {
      const settings = await this.getSettings();
      
      // Update each section
const sections = [
  'maintenance',
  'support',
  'billing',
  'order',
  'tax',
  'delivery',
];      for (const section of sections) {
        if (updateData[section]) {
          settings[section] = { ...settings[section], ...updateData[section] };
        }
      }
      
      settings.updatedBy = userId;
      await settings.save();
      
      // Clear cache
      settingsCache.del('platform_settings');
      
      return settings;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new ApiError(500, 'Failed to update settings');
    }
  }

  // ─── Vendor Settings ──────────────────────────────────
  async getVendorRegistrationStatus() {
    try {
      const settings = await this.getSettings();
      return {
        isEnabled: settings.vendor?.isRegistrationEnabled ?? true,
        autoApprove: settings.vendor?.autoApprove ?? false,
        vendorApprovalRequired: settings.vendor?.vendorApprovalRequired ?? true,
        defaultCommissionRate: settings.vendor?.defaultCommissionRate ?? 10,
        minWithdrawalAmount: settings.vendor?.minWithdrawalAmount ?? 500,
      };
    } catch (error) {
      console.error('Error getting vendor registration status:', error);
      return {
        isEnabled: true,
        autoApprove: false,
        vendorApprovalRequired: true,
        defaultCommissionRate: 10,
        minWithdrawalAmount: 500,
      };
    }
  }

  async updateVendorRegistration(isEnabled, userId) {
    try {
      const settings = await this.getSettings();
      if (!settings.vendor) settings.vendor = {};
      settings.vendor.isRegistrationEnabled = isEnabled;
      settings.updatedBy = userId;
      await settings.save();
      settingsCache.del('platform_settings');
      return settings;
    } catch (error) {
      console.error('Error updating vendor registration:', error);
      throw new ApiError(500, 'Failed to update vendor registration');
    }
  }

  async updateVendorApproval(approvalRequired, userId) {
    try {
      const settings = await this.getSettings();
      if (!settings.vendor) settings.vendor = {};
      settings.vendor.vendorApprovalRequired = approvalRequired;
      settings.updatedBy = userId;
      await settings.save();
      settingsCache.del('platform_settings');
      return settings;
    } catch (error) {
      console.error('Error updating vendor approval:', error);
      throw new ApiError(500, 'Failed to update vendor approval');
    }
  }

  async updateVendorAutoApprove(autoApprove, userId) {
    try {
      const settings = await this.getSettings();
      if (!settings.vendor) settings.vendor = {};
      settings.vendor.autoApprove = autoApprove;
      settings.updatedBy = userId;
      await settings.save();
      settingsCache.del('platform_settings');
      return settings;
    } catch (error) {
      console.error('Error updating vendor auto approve:', error);
      throw new ApiError(500, 'Failed to update vendor auto approve');
    }
  }

  async updateVendorCommission(rate, userId) {
    try {
      const settings = await this.getSettings();
      if (!settings.vendor) settings.vendor = {};
      settings.vendor.defaultCommissionRate = rate;
      settings.updatedBy = userId;
      await settings.save();
      settingsCache.del('platform_settings');
      return settings;
    } catch (error) {
      console.error('Error updating vendor commission:', error);
      throw new ApiError(500, 'Failed to update vendor commission');
    }
  }

  // ─── Order Settings ──────────────────────────────────
  async getOrderSettings() {
    try {
      const settings = await this.getSettings();
      return {
        freeShippingAbove: settings.order?.freeShippingAbove ?? 999,
        defaultShippingCharge: settings.order?.defaultShippingCharge ?? 79,
        isCODEnabled: settings.order?.isCODEnabled ?? true,
        codCharge: settings.order?.codCharge ?? 0,
        cancellationWindowHours: settings.order?.cancellationWindowHours ?? 24,
        returnWindowDays: settings.order?.returnWindowDays ?? 7,
      };
    } catch (error) {
      console.error('Error getting order settings:', error);
      return {
        freeShippingAbove: 999,
        defaultShippingCharge: 79,
        isCODEnabled: true,
        codCharge: 0,
        cancellationWindowHours: 24,
        returnWindowDays: 7,
      };
    }
  }

  async updateOrderSettings(orderData, userId) {
    try {
      const settings = await this.getSettings();
      if (!settings.order) settings.order = {};
      settings.order = { ...settings.order, ...orderData };
      settings.updatedBy = userId;
      await settings.save();
      settingsCache.del('platform_settings');
      return settings;
    } catch (error) {
      console.error('Error updating order settings:', error);
      throw new ApiError(500, 'Failed to update order settings');
    }
  }

  // ─── Tax Settings ──────────────────────────────────
  async getTaxSettings() {
    try {
      const settings = await this.getSettings();
      return {
        isGSTEnabled: settings.tax?.isGSTEnabled ?? true,
        defaultGSTRate: settings.tax?.defaultGSTRate ?? 18,
        gstNumber: settings.tax?.gstNumber ?? '',
      };
    } catch (error) {
      console.error('Error getting tax settings:', error);
      return {
        isGSTEnabled: true,
        defaultGSTRate: 18,
        gstNumber: '',
      };
    }
  }

  async updateTaxSettings(taxData, userId) {
    try {
      const settings = await this.getSettings();
      if (!settings.tax) settings.tax = {};
      settings.tax = { ...settings.tax, ...taxData };
      settings.updatedBy = userId;
      await settings.save();
      settingsCache.del('platform_settings');
      return settings;
    } catch (error) {
      console.error('Error updating tax settings:', error);
      throw new ApiError(500, 'Failed to update tax settings');
    }
  }

  // ─── Commission Settings ──────────────────────────────────
  async getCommissionSettings() {
    try {
      const settings = await this.getSettings();
      return {
        globalRate: settings.commission?.globalRate ?? 10,
        minWithdrawalAmount: settings.commission?.minWithdrawalAmount ?? 500,
      };
    } catch (error) {
      console.error('Error getting commission settings:', error);
      return {
        globalRate: 10,
        minWithdrawalAmount: 500,
      };
    }
  }

  async updateCommissionSettings(commissionData, userId) {
    try {
      const settings = await this.getSettings();
      if (!settings.commission) settings.commission = {};
      settings.commission = { ...settings.commission, ...commissionData };
      settings.updatedBy = userId;
      await settings.save();
      settingsCache.del('platform_settings');
      return settings;
    } catch (error) {
      console.error('Error updating commission settings:', error);
      throw new ApiError(500, 'Failed to update commission settings');
    }
  }

  // ─── Get Free Shipping Threshold ──────────────────────────────────
  async getFreeShippingThreshold() {
    try {
      const settings = await this.getSettings();
      return settings.order?.freeShippingAbove ?? 999;
    } catch (error) {
      console.error('Error getting free shipping threshold:', error);
      return 999;
    }
  }

  // ─── Get GST Rate ──────────────────────────────────
  async getGSTRate() {
    try {
      const settings = await this.getSettings();
      return settings.tax?.defaultGSTRate ?? 18;
    } catch (error) {
      console.error('Error getting GST rate:', error);
      return 18;
    }
  }

  // ─── Maintenance ──────────────────────────────────
  async isMaintenanceMode() {
    try {
      const settings = await this.getSettings();
      return {
        isEnabled: settings.maintenance?.isEnabled ?? false,
        message: settings.maintenance?.message ?? 'We are under maintenance. Back soon!',
      };
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
      return {
        isEnabled: false,
        message: 'We are under maintenance. Back soon!',
      };
    }
  }

  // ─── Store Info ──────────────────────────────────
  async getStoreInfo() {
    try {
      const settings = await this.getSettings();
      return settings.store || {
        name: 'My eCommerce Store',
        email: '',
        phone: '',
        address: '',
        currency: 'INR',
        currencySymbol: '₹',
      };
    } catch (error) {
      console.error('Error getting store info:', error);
      return {
        name: 'My eCommerce Store',
        email: '',
        phone: '',
        address: '',
        currency: 'INR',
        currencySymbol: '₹',
      };
    }
  }
}

module.exports = new SettingsService();