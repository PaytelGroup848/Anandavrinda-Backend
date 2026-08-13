const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },

    code: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    trackingUrlTemplate: {
      type: String,
      default: '',
      trim: true,
    },

    supportPhone: {
      type: String,
      default: '',
      trim: true,
    },

    supportEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
  },
  { _id: true }
);

const platformSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'platform_settings',
      unique: true,
      index: true,
    },

    maintenance: {
      isEnabled: {
        type: Boolean,
        default: false,
      },

      message: {
        type: String,
        default: 'We are under maintenance. Back soon!',
        trim: true,
      },
    },

    support: {
      email: {
        type: String,
        default: '',
        trim: true,
        lowercase: true,
      },

      phone: {
        type: String,
        default: '',
        trim: true,
      },
    },

    billing: {
      companyName: {
        type: String,
        default: '',
        trim: true,
      },

      address: {
        type: String,
        default: '',
        trim: true,
      },

      city: {
        type: String,
        default: '',
        trim: true,
      },

      state: {
        type: String,
        default: '',
        trim: true,
      },

      pincode: {
        type: String,
        default: '',
        trim: true,
      },

      country: {
        type: String,
        default: 'India',
        trim: true,
      },

      email: {
        type: String,
        default: '',
        trim: true,
        lowercase: true,
      },

      phone: {
        type: String,
        default: '',
        trim: true,
      },

      gstin: {
        type: String,
        default: '',
        trim: true,
        uppercase: true,
      },

      pan: {
        type: String,
        default: '',
        trim: true,
        uppercase: true,
      },
    },

    order: {
      freeShippingAbove: {
        type: Number,
        default: 999,
        min: 0,
      },

      defaultShippingCharge: {
        type: Number,
        default: 79,
        min: 0,
      },

      isCODEnabled: {
        type: Boolean,
        default: true,
      },

      codCharge: {
        type: Number,
        default: 0,
        min: 0,
      },

      cancellationWindowHours: {
        type: Number,
        default: 24,
        min: 0,
      },
    },

    tax: {
      isGSTEnabled: {
        type: Boolean,
        default: true,
      },

      defaultGSTRate: {
        type: Number,
        default: 18,
        min: 0,
      },

      gstNumber: {
        type: String,
        default: '',
        trim: true,
        uppercase: true,
      },
    },

    delivery: {
      partners: {
        type: [deliveryPartnerSchema],
        default: [
          {
            name: 'Delhivery',
            code: 'delhivery',
            isActive: true,
            trackingUrlTemplate: 'https://www.delhivery.com/track/package/{trackingNumber}',
          },
          {
            name: 'Shiprocket',
            code: 'shiprocket',
            isActive: true,
            trackingUrlTemplate: 'https://shiprocket.co/tracking/{trackingNumber}',
          },
          {
            name: 'Blue Dart',
            code: 'bluedart',
            isActive: true,
            trackingUrlTemplate: 'https://www.bluedart.com/tracking?trackFor=0&trackNo={trackingNumber}',
          },
        ],
      },
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const PlatformSettings =
  mongoose.models.PlatformSettings ||
  mongoose.model('PlatformSettings', platformSettingsSchema);

module.exports = PlatformSettings;