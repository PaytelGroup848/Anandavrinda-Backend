const Joi = require('joi');

const addToCartSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().min(1).max(999).required(),
  variantId: Joi.string().optional().allow(null),
});

const updateQuantitySchema = Joi.object({
  quantity: Joi.number().min(0).max(999).required(),
});

const applyCouponSchema = Joi.object({
  couponCode: Joi.string().required(),
});

module.exports = {
  addToCartSchema,
  updateQuantitySchema,
  applyCouponSchema,
};