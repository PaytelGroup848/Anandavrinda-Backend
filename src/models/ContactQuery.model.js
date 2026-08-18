const mongoose = require('mongoose');

const contactQuerySchema = new mongoose.Schema(
  {
    queryId: {
      type: String,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 150,
    },

    phone: {
      type: String,
      trim: true,
      default: '',
      maxlength: 20,
    },

    subject: {
      type: String,
      enum: ['general', 'order', 'product', 'vendor', 'other'],
      default: 'general',
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'closed'],
      default: 'new',
      index: true,
    },

    adminNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },

    metadata: {
      userAgent: String,
      ipAddress: String,
    },
  },
  { timestamps: true }
);

contactQuerySchema.pre('save', async function () {
  if (this.queryId) {
    return;
  }

  const now = new Date();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const prefix = `CNT${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    '0'
  )}${String(now.getDate()).padStart(2, '0')}`;

  const count = await mongoose.model('ContactQuery').countDocuments({
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  this.queryId = `${prefix}${String(count + 1).padStart(4, '0')}`;
});

contactQuerySchema.index({ status: 1, createdAt: -1 });
contactQuerySchema.index({ name: 'text', email: 'text', message: 'text', queryId: 'text' });

module.exports = mongoose.model('ContactQuery', contactQuerySchema);
