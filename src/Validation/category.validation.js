const Joi = require('joi');

const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Category name is required',
    'string.min': 'Category name must be at least 2 characters',
    'string.max': 'Category name cannot exceed 100 characters',
  }),
  description: Joi.string().max(500).optional().allow(''),
  parent: Joi.string().optional().allow(null, ''),
  // FIX: Allow image as string (base64) or object
  image: Joi.alternatives().try(
    Joi.string().optional().allow(null, ''),
    Joi.object({
      url: Joi.string().optional(),
      publicId: Joi.string().optional(),
    }).optional()
  ).optional(),
  displayOrder: Joi.number().min(0).default(0),
  isFeatured: Joi.boolean().default(false),
  seo: Joi.object({
    metaTitle: Joi.string().max(60).optional().allow(''),
    metaDescription: Joi.string().max(160).optional().allow(''),
    keywords: Joi.array().items(Joi.string()).optional(),
  }).optional(),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional().allow(''),
  parent: Joi.string().optional().allow(null),

  image: Joi.alternatives().try(
    Joi.string().optional().allow(null, ''),
    Joi.object({
      url: Joi.string().optional(),
      publicId: Joi.string().optional(),
    }).optional()
  ).optional(),
  displayOrder: Joi.number().min(0).optional(),
  isFeatured: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  seo: Joi.object({
    metaTitle: Joi.string().max(60).optional().allow(''),
    metaDescription: Joi.string().max(160).optional().allow(''),
    keywords: Joi.array().items(Joi.string()).optional(),
  }).optional(),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};