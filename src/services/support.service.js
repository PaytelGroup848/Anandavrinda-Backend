const SupportTicket = require('../models/SupportTicket.model');
const ApiError = require('../utils/ApiError');

class SupportService {
  isAdmin(role) {
    return ['super_admin', 'sub_admin', 'admin'].includes(role);
  }

  async createTicket(userId, userRole, payload, meta = {}) {
    const { subject, category, priority, message, relatedOrder } = payload;

    if (!subject || subject.trim().length < 5) {
      throw new ApiError(400, 'Subject must be at least 5 characters');
    }

    if (!message || message.trim().length < 5) {
      throw new ApiError(400, 'Message must be at least 5 characters');
    }

    const ticket = await SupportTicket.create({
      user: userId,
      subject: subject.trim(),
      category: category || 'other',
      priority: priority || 'medium',
      relatedOrder: relatedOrder || null,
      metadata: meta,
      messages: [
        {
          sender: userId,
          senderRole: userRole,
          message: message.trim(),
        },
      ],
      lastMessageAt: new Date(),
    });

    return ticket.populate([
      { path: 'user', select: 'name email phone role' },
      { path: 'assignedTo', select: 'name email role' },
      { path: 'relatedOrder', select: 'orderId total status payment' },
    ]);
  }

  async getTickets(userId, userRole, filters = {}) {
    const {
      status,
      priority,
      category,
      search,
      page = 1,
      limit = 10,
      assignedTo,
    } = filters;

    const query = {};

    if (!this.isAdmin(userRole)) {
      query.user = userId;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTo && this.isAdmin(userRole)) query.assignedTo = assignedTo;

    if (search) {
      query.$or = [
        { ticketId: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('user', 'name email phone role')
        .populate('assignedTo', 'name email role')
        .populate('relatedOrder', 'orderId total status')
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      SupportTicket.countDocuments(query),
    ]);

    return {
      tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getTicketById(ticketId, userId, userRole) {
    const query = {
      $or: [{ _id: ticketId }, { ticketId }],
    };

    if (!this.isAdmin(userRole)) {
      query.user = userId;
    }

    const ticket = await SupportTicket.findOne(query)
      .populate('user', 'name email phone role')
      .populate('assignedTo', 'name email role')
      .populate('relatedOrder', 'orderId total status payment')
      .populate('messages.sender', 'name email role');

    if (!ticket) {
      throw new ApiError(404, 'Support ticket not found');
    }

    return ticket;
  }

  async replyTicket(ticketId, userId, userRole, payload) {
    const { message, isInternalNote = false } = payload;

    if (!message || message.trim().length < 2) {
      throw new ApiError(400, 'Message is required');
    }

    const ticket = await this.getTicketById(ticketId, userId, userRole);

    if (ticket.status === 'closed') {
      throw new ApiError(400, 'Cannot reply to a closed ticket');
    }

    if (isInternalNote && !this.isAdmin(userRole)) {
      throw new ApiError(403, 'Only admin can add internal notes');
    }

    ticket.messages.push({
      sender: userId,
      senderRole: userRole,
      message: message.trim(),
      isInternalNote: this.isAdmin(userRole) ? Boolean(isInternalNote) : false,
    });

    ticket.lastMessageAt = new Date();

    if (this.isAdmin(userRole) && ticket.status === 'open') {
      ticket.status = 'in_progress';
    }

    await ticket.save();

    return this.getTicketById(ticket._id, userId, userRole);
  }

  async updateTicketStatus(ticketId, userId, userRole, payload) {
    if (!this.isAdmin(userRole)) {
      throw new ApiError(403, 'Only admin can update ticket status');
    }

    const { status, priority, assignedTo } = payload;

    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      throw new ApiError(404, 'Support ticket not found');
    }

    if (status) {
      if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
        throw new ApiError(400, 'Invalid ticket status');
      }

      ticket.status = status;

      if (status === 'resolved') {
        ticket.resolvedAt = new Date();
      }

      if (status === 'closed') {
        ticket.closedAt = new Date();
      }
    }

    if (priority) {
      if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
        throw new ApiError(400, 'Invalid ticket priority');
      }

      ticket.priority = priority;
    }

    if (assignedTo !== undefined) {
      ticket.assignedTo = assignedTo || null;
    }

    await ticket.save();

    return this.getTicketById(ticket._id, userId, userRole);
  }

  async deleteTicket(ticketId, userRole) {
    if (!this.isAdmin(userRole)) {
      throw new ApiError(403, 'Only admin can delete support tickets');
    }

    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      throw new ApiError(404, 'Support ticket not found');
    }

    await SupportTicket.findByIdAndDelete(ticketId);

    return ticket;
  }

  async getSupportStats(userRole) {
    if (!this.isAdmin(userRole)) {
      throw new ApiError(403, 'Only admin can view support stats');
    }

    const [
      total,
      open,
      inProgress,
      resolved,
      closed,
      urgent,
    ] = await Promise.all([
      SupportTicket.countDocuments(),
      SupportTicket.countDocuments({ status: 'open' }),
      SupportTicket.countDocuments({ status: 'in_progress' }),
      SupportTicket.countDocuments({ status: 'resolved' }),
      SupportTicket.countDocuments({ status: 'closed' }),
      SupportTicket.countDocuments({ priority: 'urgent' }),
    ]);

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
      urgent,
    };
  }
}

module.exports = new SupportService();