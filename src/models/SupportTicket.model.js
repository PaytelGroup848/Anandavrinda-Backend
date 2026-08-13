const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    senderRole: {
      type: String,
      enum: ['customer', 'vendor', 'super_admin', 'sub_admin', 'admin'],
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    attachments: [
      {
        url: String,
        publicId: String,
        fileName: String,
        fileType: String,
        fileSize: Number,
      },
    ],

    isInternalNote: {
      type: Boolean,
      default: false,
    },

    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 150,
    },

    category: {
      type: String,
      enum: [
        'order',
        'payment',
        'refund',
        'delivery',
        'product',
        'account',
        'technical',
        'other',
      ],
      default: 'other',
      index: true,
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },

    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },

    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },

    messages: [supportMessageSchema],

    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    metadata: {
      userAgent: String,
      ipAddress: String,
    },
  },
  { timestamps: true }
);

supportTicketSchema.pre('save', async function () {
  if (this.ticketId) {
    return;
  }

  const now = new Date();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const prefix = `TKT${now.getFullYear()}${String(
    now.getMonth() + 1
  ).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  const count = await mongoose.model('SupportTicket').countDocuments({
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  this.ticketId = `${prefix}${String(count + 1).padStart(4, '0')}`;
});

supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
supportTicketSchema.index({ user: 1, createdAt: -1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ subject: 'text', ticketId: 'text' });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);