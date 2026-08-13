const Cart = require('../models/Cart.model');
const Product = require('../models/Products.model');
const ProductVariant = require('../models/productvarient.model');
const Coupon = require('../models/Coupon.model');
const PlatformSettings = require('../models/PlatformSettings.model');
const ApiError = require('../utils/ApiError');

class CartService {
  async getCart(userId) {
    let cart = await Cart.findOne({ user: userId })
      .populate('items.product', 'name slug price originalPrice images stock status trackInventory')
      .populate('items.variant', 'name price originalPrice stock attributes');

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [],
      });
    }

    const totals = this.calculateTotals(cart);

    return {
      cart,
      ...totals,
    };
  }

  async addToCart(userId, productId, quantity, variantId = null) {
    const product = await Product.findOne({
      _id: productId,
      status: 'active',
    });

    if (!product) {
      throw new ApiError(404, 'Product not found or inactive');
    }

    let price = Number(product.price || 0);
    let originalPrice = Number(product.originalPrice || product.price || 0);
    let variantName = null;
    let availableStock = product.stock;

    if (variantId) {
      const variant = await ProductVariant.findOne({
        _id: variantId,
        product: productId,
        isActive: true,
      });

      if (!variant) {
        throw new ApiError(404, 'Variant not found');
      }

      price = Number(variant.price || 0);
      originalPrice = Number(variant.originalPrice || variant.price || 0);
      variantName = variant.name;
      availableStock = variant.stock;
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [],
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (variantId ? item.variant?.toString() === variantId : !item.variant)
    );

    const currentQuantity =
      existingItemIndex > -1 ? Number(cart.items[existingItemIndex].quantity || 0) : 0;

    const finalQuantity = currentQuantity + Number(quantity || 1);

    if (variantId) {
      if (availableStock < finalQuantity) {
        throw new ApiError(400, `Only ${availableStock} items available in stock`);
      }
    } else if (product.trackInventory && availableStock < finalQuantity) {
      throw new ApiError(400, `Only ${availableStock} items available in stock`);
    }

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity = finalQuantity;
      cart.items[existingItemIndex].priceSnapshot = {
        price,
        originalPrice,
        variantName,
      };
      cart.items[existingItemIndex].isPriceChanged = false;
    } else {
      cart.items.push({
        product: productId,
        variant: variantId,
        quantity: Number(quantity || 1),
        priceSnapshot: {
          price,
          originalPrice,
          variantName,
        },
      });
    }

    cart.lastActivityAt = new Date();

    for (const item of cart.items) {
      const currentProduct = await Product.findById(item.product);
      if (!currentProduct) continue;

      let currentPrice = Number(currentProduct.price || 0);

      if (item.variant) {
        const variant = await ProductVariant.findById(item.variant);
        if (variant) currentPrice = Number(variant.price || 0);
      }

      item.isPriceChanged =
        Number(currentPrice || 0) !== Number(item.priceSnapshot?.price || 0);
    }

    await cart.save();

    return this.getCart(userId);
  }

  async updateQuantity(userId, itemId, quantity) {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      throw new ApiError(404, 'Cart not found');
    }

    const item = cart.items.id(itemId);

    if (!item) {
      throw new ApiError(404, 'Item not found in cart');
    }

    const nextQuantity = Number(quantity || 0);

    if (nextQuantity <= 0) {
      cart.items.pull({ _id: itemId });
      cart.lastActivityAt = new Date();
      await cart.save();
      return this.getCart(userId);
    }

    const product = await Product.findOne({
      _id: item.product,
      status: 'active',
    });

    if (!product) {
      throw new ApiError(404, 'Product not found or inactive');
    }

    if (item.variant) {
      const variant = await ProductVariant.findOne({
        _id: item.variant,
        product: product._id,
        isActive: true,
      });

      if (!variant) {
        throw new ApiError(404, 'Variant not found');
      }

      if (variant.stock < nextQuantity) {
        throw new ApiError(400, `Only ${variant.stock} items available in stock`);
      }

      item.priceSnapshot = {
        price: Number(variant.price || 0),
        originalPrice: Number(variant.originalPrice || variant.price || 0),
        variantName: variant.name,
      };
    } else {
      if (product.trackInventory && product.stock < nextQuantity) {
        throw new ApiError(400, `Only ${product.stock} items available in stock`);
      }

      item.priceSnapshot = {
        price: Number(product.price || 0),
        originalPrice: Number(product.originalPrice || product.price || 0),
        variantName: null,
      };
    }

    item.quantity = nextQuantity;
    item.isPriceChanged = false;
    cart.lastActivityAt = new Date();

    await cart.save();

    return this.getCart(userId);
  }

  async removeItem(userId, itemId) {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      throw new ApiError(404, 'Cart not found');
    }

    const itemExists = cart.items.some((item) => item._id.toString() === itemId);

    if (!itemExists) {
      throw new ApiError(404, 'Item not found in cart');
    }

    cart.items.pull({ _id: itemId });
    cart.lastActivityAt = new Date();

    await cart.save();

    return this.getCart(userId);
  }

  async clearCart(userId) {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return this.getCart(userId);
    }

    cart.items = [];
    cart.appliedCoupon = {
      couponId: null,
      code: null,
      discountAmount: 0,
    };

    cart.lastActivityAt = new Date();

    await cart.save();

    return this.getCart(userId);
  }

  async applyCoupon(userId, couponCode) {
    const cart = await Cart.findOne({ user: userId });

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, 'Cart is empty');
    }

    const coupon = await Coupon.findOne({
      code: String(couponCode || '').toUpperCase(),
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    if (!coupon) {
      throw new ApiError(404, 'Invalid or expired coupon');
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new ApiError(400, 'Coupon usage limit exceeded');
    }

    const subtotal = this.calculateSubtotal(cart);

    if (subtotal < coupon.minOrderAmount) {
      throw new ApiError(
        400,
        `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`
      );
    }

    let discountAmount = 0;

    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100);

      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, subtotal);

    cart.appliedCoupon = {
      couponId: coupon._id,
      code: coupon.code,
      discountAmount,
    };

    cart.lastActivityAt = new Date();

    await cart.save();

    return this.getCart(userId);
  }

  async removeCoupon(userId) {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      throw new ApiError(404, 'Cart not found');
    }

    cart.appliedCoupon = {
      couponId: null,
      code: null,
      discountAmount: 0,
    };

    cart.lastActivityAt = new Date();

    await cart.save();

    return this.getCart(userId);
  }

  async getCartPricingSettings() {
    const fallbackSettings = {
      freeDeliveryThreshold: 999,
      deliveryCharge: 79,
      gstPercent: 18,
    };

    try {
      const settings = await PlatformSettings.findOne({}).sort({ createdAt: -1 }).lean();

      if (!settings) {
        return fallbackSettings;
      }

      const orderSettings = settings.order || {};
      const taxSettings = settings.tax || {};

      const freeDeliveryThreshold = Number(
        orderSettings.freeShippingAbove ??
          orderSettings.freeDeliveryThreshold ??
          orderSettings.minimumFreeDeliveryAmount ??
          fallbackSettings.freeDeliveryThreshold
      );

      const deliveryCharge = Number(
        orderSettings.defaultShippingCharge ??
          orderSettings.deliveryCharge ??
          orderSettings.shippingCharge ??
          fallbackSettings.deliveryCharge
      );

      const gstPercent =
        taxSettings.isGSTEnabled === false
          ? 0
          : Number(
              taxSettings.defaultGSTRate ??
                taxSettings.gstPercent ??
                taxSettings.gstRate ??
                taxSettings.taxRate ??
                fallbackSettings.gstPercent
            );

      return {
        freeDeliveryThreshold,
        deliveryCharge,
        gstPercent,
      };
    } catch (error) {
      console.error('Cart pricing settings error:', error);
      return fallbackSettings;
    }
  }

  async getCartSummary(userId, couponCode = '') {
    const result = await this.getCart(userId);
    const cart = result?.cart;
    const cartItems = cart?.items || [];

    const settings = await this.getCartPricingSettings();

    const frontendCoupons = {
      SAVE10: { type: 'percent', value: 10, label: '10% off' },
      FLAT500: { type: 'flat', value: 500, label: '₹500 off' },
      WELCOME20: { type: 'percent', value: 20, label: '20% off' },
    };

    let totalItems = 0;
    let subtotal = 0;
    let originalTotal = 0;

    for (const item of cartItems) {
      const quantity = Number(item.quantity || 0);

      // Current admin product/variant price first, snapshot fallback second.
      const price = Number(
        item.variant?.price ??
          item.product?.price ??
          item.priceSnapshot?.price ??
          0
      );

      const originalPrice = Number(
        item.variant?.originalPrice ??
          item.product?.originalPrice ??
          item.priceSnapshot?.originalPrice ??
          price
      );

      totalItems += quantity;
      subtotal += price * quantity;
      originalTotal += originalPrice * quantity;
    }

    const productSavings = Math.max(0, originalTotal - subtotal);

    let appliedCoupon = null;
    let couponDiscount = 0;

    const savedCouponCode = cart?.appliedCoupon?.code;
    const activeCouponCode = String(couponCode || savedCouponCode || '')
      .trim()
      .toUpperCase();

    if (activeCouponCode && frontendCoupons[activeCouponCode]) {
      appliedCoupon = {
        code: activeCouponCode,
        ...frontendCoupons[activeCouponCode],
      };

      if (appliedCoupon.type === 'percent') {
        couponDiscount = Math.round((subtotal * appliedCoupon.value) / 100);
      } else {
        couponDiscount = Math.min(appliedCoupon.value, subtotal);
      }
    } else if (cart?.appliedCoupon?.discountAmount > 0) {
      appliedCoupon = {
        code: cart.appliedCoupon.code,
        type: 'backend',
        value: cart.appliedCoupon.discountAmount,
        label: `₹${cart.appliedCoupon.discountAmount} off`,
      };

      couponDiscount = Math.min(
        Number(cart.appliedCoupon.discountAmount || 0),
        subtotal
      );
    }

    const shipping =
      subtotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryCharge;

    const taxableAmount = Math.max(0, subtotal - couponDiscount);
    const tax = Math.round((taxableAmount * settings.gstPercent) / 100);
    const total = Math.max(0, taxableAmount + shipping + tax);

    const totalSavings =
      productSavings +
      couponDiscount +
      (shipping === 0 ? settings.deliveryCharge : 0);

    return {
      summary: {
        totalItems,
        subtotal,
        originalTotal,
        productSavings,
        couponDiscount,
        shipping,
        tax,
        total,
        totalSavings,
        freeDeliveryThreshold: settings.freeDeliveryThreshold,
        deliveryCharge: settings.deliveryCharge,
        gstPercent: settings.gstPercent,
        coupon: appliedCoupon,
      },
      settings,
      coupons: frontendCoupons,
    };
  }

  calculateSubtotal(cart) {
    return cart.items.reduce((total, item) => {
      return (
        total +
        Number(item.priceSnapshot?.price || 0) * Number(item.quantity || 0)
      );
    }, 0);
  }

  calculateTotals(cart) {
    const subtotal = this.calculateSubtotal(cart);
    const discount = Math.min(cart.appliedCoupon?.discountAmount || 0, subtotal);
    const total = subtotal - discount;

    return {
      subtotal,
      discount,
      total,
      itemCount: cart.items.length,
      totalItems: cart.items.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      ),
    };
  }
}

module.exports = new CartService();
