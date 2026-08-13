const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const addressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      default: "Home",
    },
    fullName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    addressLine1: {
      type: String,
      required: true,
    },
    addressLine2: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: "India",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      default: null,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    avatar: {
      url: {
        type: String,
        default: null,
      },
      publicId: {
        type: String,
        default: null,
      },
    },

    role: {
      type: String,
      enum: ["super_admin", "sub_admin", "vendor", "customer"],
      default: "customer",
    },

    permissions: {
      type: [String],
      default: [],
      enum: [
        // Categories
        'categories_view',
        'categories_create',
        'categories_delete',
        
        // Products
        'products_view',
        'products_create',
        'products_delete',
        // support 
        'support',
        
        // Orders
        'orders_view',
        
        // Customers
        'customers_view',
      ],
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "pending_verification","blocked","pending"],
      default: "pending_verification",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerifiedAt: {
      type: Date,
      default: null,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    accountLockedUntil: {
      type: Date,
      default: null,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    addresses: {
      type: [addressSchema],
      default: [],
    },

    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: false,
      },
      pushNotifications: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────
userSchema.index({ role: 1, status: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ createdAt: -1 });

// ─── ✅ FIXED: Password Hash - Without using 'next' ───────
// Remove pre-save hook entirely - handle hashing in service
// userSchema.pre('save', function(next) { ... }); // ❌ REMOVED

// ─── Compare Password ────────────────────────────────────
userSchema.methods.comparePassword = async function(enteredPassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── Account Lock Check ──────────────────────────────────
userSchema.methods.isAccountLocked = function() {
  if (!this.accountLockedUntil) {
    return false;
  }
  return this.accountLockedUntil > new Date();
};

const User = mongoose.model("User", userSchema);

module.exports = User;