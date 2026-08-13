/**
 * App-wide Constants
 *
 * Magic strings/numbers poore code mein nahi likhte.
 * Ek jagah define karo, sab jagah import karo.
 *
 * Agar badalna ho to sirf yahan badalna hoga.
 */

// ─── User Roles ───────────────────────────────────────────────
const ROLES = {
  SUPER_ADMIN: "super_admin",
  SUB_ADMIN: "sub_admin",
  VENDOR: "vendor",
  CUSTOMER: "customer",
};

// ─── User Status ──────────────────────────────────────────────
const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
  PENDING_VERIFICATION: "pending_verification",
};

// ─── Vendor Status ────────────────────────────────────────────
const VENDOR_STATUS = {
  PENDING: "pending",       // Registered, waiting for approval
  APPROVED: "approved",     // Admin ne approve kiya
  REJECTED: "rejected",     // Admin ne reject kiya
  SUSPENDED: "suspended",   // Temporarily band
};

// ─── Product Status ───────────────────────────────────────────
const PRODUCT_STATUS = {
  DRAFT: "draft",           // Vendor ne save kiya, publish nahi
  ACTIVE: "active",         // Live on site
  INACTIVE: "inactive",     // Hidden
  REJECTED: "rejected",     // Admin ne reject kiya
  OUT_OF_STOCK: "out_of_stock",
};

// ─── Order Status ─────────────────────────────────────────────
const ORDER_STATUS = {
  PENDING: "pending",             // Order placed, payment pending
  PAYMENT_FAILED: "payment_failed",
  CONFIRMED: "confirmed",         // Payment success
  PROCESSING: "processing",       // Vendor preparing
  SHIPPED: "shipped",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  RETURN_REQUESTED: "return_requested",
  RETURNED: "returned",
  REFUND_INITIATED: "refund_initiated",
  REFUNDED: "refunded",
};

// ─── Payment Status ───────────────────────────────────────────
const PAYMENT_STATUS = {
  PENDING: "pending",
  SUCCESS: "success",
  FAILED: "failed",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded",
};

// ─── Payment Methods ──────────────────────────────────────────
const PAYMENT_METHODS = {
  RAZORPAY: "razorpay",
  COD: "cod",         
  WALLET: "wallet",
};

// ─── Sub Admin Permissions ────────────────────────────────────
// Format: "resource:action"
const PERMISSIONS = {
  // Vendor management
  VENDOR_VIEW: "vendor:view",
  VENDOR_APPROVE: "vendor:approve",
  VENDOR_REJECT: "vendor:reject",
  VENDOR_SUSPEND: "vendor:suspend",

  // Product management
  PRODUCT_VIEW: "product:view",
  PRODUCT_EDIT: "product:edit",
  PRODUCT_DELETE: "product:delete",
  PRODUCT_APPROVE: "product:approve",

  // Order management
  ORDER_VIEW: "order:view",
  ORDER_MANAGE: "order:manage",
  ORDER_REFUND: "order:refund",

  // User management
  USER_VIEW: "user:view",
  USER_SUSPEND: "user:suspend",

  // Coupon management
  COUPON_VIEW: "coupon:view",
  COUPON_MANAGE: "coupon:manage",

  // Category management
  CATEGORY_MANAGE: "category:manage",

  // Analytics
  ANALYTICS_VIEW: "analytics:view",

  // CMS
  CMS_MANAGE: "cms:manage",
};

// ─── Cache Keys ───────────────────────────────────────────────
// Sab cache keys ek jagah — typo se bachao
const CACHE_KEYS = {
  PRODUCT_LIST: (page, limit, filters) =>
    `product:list:${page}:${limit}:${JSON.stringify(filters)}`,
  PRODUCT_DETAIL: (id) => `product:detail:${id}`,
  CATEGORY_TREE: "category:tree:all",
  PLATFORM_SETTINGS: "settings:platform",
  VENDOR_REGISTRATION_STATUS: "settings:vendor_registration",
  USER_SESSION: (userId, deviceId) => `session:${userId}:${deviceId}`,
  OTP: (email, type) => `otp:${type}:${email}`,
  RATE_LIMIT: (ip) => `ratelimit:${ip}`,
};

// ─── Cache TTL (seconds) ──────────────────────────────────────
const CACHE_TTL = {
  PRODUCT_LIST: 300,        // 5 minutes
  PRODUCT_DETAIL: 600,      // 10 minutes
  CATEGORY_TREE: 3600,      // 1 hour
  PLATFORM_SETTINGS: 600,   // 10 minutes
  OTP: 600,                 // 10 minutes
  SESSION: 604800,          // 7 days
};

// ─── OTP Types ────────────────────────────────────────────────
const OTP_TYPES = {
  EMAIL_VERIFY: "email_verify",
  FORGOT_PASSWORD: "forgot_password",
  LOGIN: "login",
  WITHDRAW: "withdraw",
};

// ─── Token Types ──────────────────────────────────────────────
const TOKEN_TYPES = {
  ACCESS: "access",
  REFRESH: "refresh",
  EMAIL_VERIFY: "email_verify",
  PASSWORD_RESET: "password_reset",
};

// ─── Audit Actions ────────────────────────────────────────────
const AUDIT_ACTIONS = {
  LOGIN: "login",
  LOGOUT: "logout",
  REGISTER: "register",
  PASSWORD_CHANGE: "password_change",
  PROFILE_UPDATE: "profile_update",
  VENDOR_APPROVED: "vendor_approved",
  VENDOR_REJECTED: "vendor_rejected",
  ORDER_PLACED: "order_placed",
  ORDER_CANCELLED: "order_cancelled",
  PRODUCT_CREATED: "product_created",
  PRODUCT_DELETED: "product_deleted",
  COUPON_APPLIED: "coupon_applied",
  SETTINGS_UPDATED: "settings_updated",
};

// ─── Notification Types ───────────────────────────────────────
const NOTIFICATION_TYPES = {
  ORDER_PLACED: "order_placed",
  ORDER_SHIPPED: "order_shipped",
  ORDER_DELIVERED: "order_delivered",
  ORDER_CANCELLED: "order_cancelled",
  VENDOR_APPROVED: "vendor_approved",
  VENDOR_REJECTED: "vendor_rejected",
  PAYMENT_SUCCESS: "payment_success",
  PAYMENT_FAILED: "payment_failed",
  REVIEW_RECEIVED: "review_received",
  LOW_STOCK: "low_stock",
  WITHDRAWAL_APPROVED: "withdrawal_approved",
};

// ─── File Upload ──────────────────────────────────────────────
const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  ALLOWED_DOCUMENT_TYPES: ["application/pdf"],
  FOLDERS: {
    PRODUCT_IMAGES: "products",
    USER_AVATARS: "avatars",
    VENDOR_DOCUMENTS: "vendor-docs",
    CATEGORY_IMAGES: "categories",
    BANNERS: "banners",
  },
};

// ─── Pagination Defaults ──────────────────────────────────────
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// ─── Commission ───────────────────────────────────────────────
const COMMISSION = {
  DEFAULT_RATE: 10, // 10% platform commission
};

module.exports = {
  ROLES,
  USER_STATUS,
  VENDOR_STATUS,
  PRODUCT_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  PERMISSIONS,
  CACHE_KEYS,
  CACHE_TTL,
  OTP_TYPES,
  TOKEN_TYPES,
  AUDIT_ACTIONS,
  NOTIFICATION_TYPES,
  UPLOAD,
  PAGINATION,
  COMMISSION,
};