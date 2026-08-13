const Joi = require('joi');

const addressSchema = Joi.object({
  fullName: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  email: Joi.string().email().optional().allow('', null),
  addressLine1: Joi.string().trim().required(),
  addressLine2: Joi.string().trim().optional().allow('', null),
  city: Joi.string().trim().required(),
  state: Joi.string().trim().required(),
  pincode: Joi.string().trim().required(),
  country: Joi.string().trim().default('India'),
  landmark: Joi.string().trim().optional().allow('', null),
});

const createOrderSchema = Joi.object({
  shippingAddress: addressSchema.required(),
  billingAddress: addressSchema.optional(),
  paymentMethod: Joi.string().valid('cod', 'razorpay', 'stripe').default('cod'),
  customerNote: Joi.string().allow('', null).optional(),
  email: Joi.string().email().allow('', null).optional(),
});

module.exports = { createOrderSchema };