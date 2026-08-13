const Joi = require('joi');

const imageSchema = Joi.object({
  url: Joi.string().required(),
  publicId: Joi.string().optional().allow(null, ''),
  isMain: Joi.boolean().default(false),
  displayOrder: Joi.number().default(0),
});

const variantInputSchema = Joi.object({
  name: Joi.string().trim().required(),
  price: Joi.number().min(0).optional(),
  originalPrice: Joi.number().min(0).optional().allow(null),
  stock: Joi.number().min(0).default(0),
  attributes: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        value: Joi.string().required(),
      })
    )
    .optional(),
  sku: Joi.string().optional().allow(null, ''),
  image: Joi.object({
    url: Joi.string().optional().allow(null, ''),
    publicId: Joi.string().optional().allow(null, ''),
  }).optional(),
  lowStockThreshold: Joi.number().min(0).optional(),
  displayOrder: Joi.number().optional(),
});

const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(300).required().messages({
    'string.empty': 'Product name is required',
    'string.min': 'Product name must be at least 2 characters',
    'string.max': 'Product name cannot exceed 300 characters',
  }),
  description: Joi.string().required().messages({
    'string.empty': 'Description is required',
  }),
  shortDescription: Joi.string().max(500).optional().allow(''),
  category: Joi.string().required().messages({
    'string.empty': 'Category is required',
  }),
  subCategory: Joi.string().optional().allow(null, ''),
  brand: Joi.string().optional().allow(null, ''),
  price: Joi.number().min(0).required().messages({
    'number.base': 'Valid price is required',
    'number.min': 'Price must be greater than 0',
  }),
  originalPrice: Joi.number().min(0).optional().allow(null),
  stock: Joi.number().min(0).default(0),
  trackInventory: Joi.boolean().default(true),
  lowStockThreshold: Joi.number().min(0).default(5),
  images: Joi.array().items(imageSchema).optional(),
  specifications: Joi.array()
    .items(
      Joi.object({
        label: Joi.string().required(),
        value: Joi.string().required(),
      })
    )
    .optional(),
  highlights: Joi.array().items(Joi.string()).optional(),
  taxClass: Joi.string().valid('none', 'gst_5', 'gst_12', 'gst_18', 'gst_28').default('gst_18'),
  seo: Joi.object({
    metaTitle: Joi.string().max(60).optional().allow(''),
    metaDescription: Joi.string().max(160).optional().allow(''),
    keywords: Joi.array().items(Joi.string()).optional(),
  }).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isFeatured: Joi.boolean().default(false),
  unitsPerPack: Joi.number().integer().min(1).default(1),
  hasVariants: Joi.boolean().default(false),
  variants: Joi.array().items(variantInputSchema).optional(),
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(300).optional(),
  description: Joi.string().optional(),
  shortDescription: Joi.string().max(500).optional().allow(''),
  category: Joi.string().optional(),
  subCategory: Joi.string().optional().allow(null, ''),
  brand: Joi.string().optional().allow(null, ''),
  price: Joi.number().min(0).optional(),
  originalPrice: Joi.number().min(0).optional().allow(null),
  stock: Joi.number().min(0).optional(),
  trackInventory: Joi.boolean().optional(),
  lowStockThreshold: Joi.number().min(0).optional(),
  images: Joi.array().items(imageSchema).optional(),
  specifications: Joi.array()
    .items(
      Joi.object({
        label: Joi.string().required(),
        value: Joi.string().required(),
      })
    )
    .optional(),
  highlights: Joi.array().items(Joi.string()).optional(),
  taxClass: Joi.string().valid('none', 'gst_5', 'gst_12', 'gst_18', 'gst_28').optional(),
  seo: Joi.object({
    metaTitle: Joi.string().max(60).optional().allow(''),
    metaDescription: Joi.string().max(160).optional().allow(''),
    keywords: Joi.array().items(Joi.string()).optional(),
  }).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isFeatured: Joi.boolean().optional(),
  unitsPerPack: Joi.number().integer().min(1).optional(),
  hasVariants: Joi.boolean().optional(),
  variants: Joi.array().items(variantInputSchema).optional(),
  status: Joi.string().valid('draft', 'active', 'inactive', 'rejected').optional(),
});

const createVariantSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Variant name is required',
  }),
  sku: Joi.string().optional().allow(null, ''),
  attributes: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        value: Joi.string().required(),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one attribute is required',
    }),
  price: Joi.number().min(0).required().messages({
    'number.base': 'Valid price is required',
    'number.min': 'Price must be greater than 0',
  }),
  originalPrice: Joi.number().min(0).optional().allow(null),
  stock: Joi.number().min(0).default(0),
  lowStockThreshold: Joi.number().min(0).default(5),
  image: Joi.object({
    url: Joi.string().uri().optional(),
    publicId: Joi.string().optional(),
  }).optional(),
  displayOrder: Joi.number().default(0),
});

const updateVariantSchema = Joi.object({
  name: Joi.string().optional(),
  sku: Joi.string().optional().allow(null, ''),
  attributes: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        value: Joi.string().required(),
      })
    )
    .min(1)
    .optional(),
  price: Joi.number().min(0).optional(),
  originalPrice: Joi.number().min(0).optional().allow(null),
  stock: Joi.number().min(0).optional(),
  lowStockThreshold: Joi.number().min(0).optional(),
  image: Joi.object({
    url: Joi.string().uri().optional(),
    publicId: Joi.string().optional(),
  }).optional(),
  displayOrder: Joi.number().optional(),
  isActive: Joi.boolean().optional(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
};