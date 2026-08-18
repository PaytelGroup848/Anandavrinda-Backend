const ContactQuery = require('../models/ContactQuery.model');
const ApiError = require('../utils/ApiError');

class ContactService {
  async createQuery(payload, meta = {}) {
    const { name, email, phone, subject, message } = payload;

    if (!name || name.trim().length < 2) {
      throw new ApiError(400, 'Name must be at least 2 characters');
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new ApiError(400, 'A valid email is required');
    }

    if (!message || message.trim().length < 5) {
      throw new ApiError(400, 'Message must be at least 5 characters');
    }

    const query = await ContactQuery.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      subject: subject || 'general',
      message: message.trim(),
      metadata: meta,
    });

    return query;
  }

  async getStats() {
    const [total, newCount, read, replied, closed] = await Promise.all([
      ContactQuery.countDocuments(),
      ContactQuery.countDocuments({ status: 'new' }),
      ContactQuery.countDocuments({ status: 'read' }),
      ContactQuery.countDocuments({ status: 'replied' }),
      ContactQuery.countDocuments({ status: 'closed' }),
    ]);

    return {
      total,
      new: newCount,
      read,
      replied,
      closed,
    };
  }

  async getQueries(filters = {}) {
    const { status, subject, search, page = 1, limit = 10 } = filters;

    const query = {};

    if (status) query.status = status;
    if (subject) query.subject = subject;

    if (search) {
      query.$or = [
        { queryId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [queries, total] = await Promise.all([
      ContactQuery.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ContactQuery.countDocuments(query),
    ]);

    return {
      queries,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  async getQueryById(id) {
    const query = await ContactQuery.findById(id);

    if (!query) {
      throw new ApiError(404, 'Contact query not found');
    }

    return query;
  }

  async updateQuery(id, payload) {
    const allowedFields = ['status', 'adminNotes'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (payload[field] !== undefined) {
        updates[field] = payload[field];
      }
    });

    const query = await ContactQuery.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!query) {
      throw new ApiError(404, 'Contact query not found');
    }

    return query;
  }

  async deleteQuery(id) {
    const query = await ContactQuery.findByIdAndDelete(id);

    if (!query) {
      throw new ApiError(404, 'Contact query not found');
    }

    return query;
  }
}

module.exports = new ContactService();
