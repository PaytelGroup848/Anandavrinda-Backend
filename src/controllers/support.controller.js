const supportService = require('../services/support.service');
const ApiResponse = require('../utils/ApiResponse');

class SupportController {
  async createTicket(req, res, next) {
    try {
      const meta = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      };

      const ticket = await supportService.createTicket(
        req.user._id,
        req.user.role,
        req.body,
        meta
      );

      res
        .status(201)
        .json(ApiResponse.success('Support ticket created successfully', { ticket }));
    } catch (error) {
      next(error);
    }
  }

  async getTickets(req, res, next) {
    try {
      const result = await supportService.getTickets(
        req.user._id,
        req.user.role,
        req.query
      );

      res
        .status(200)
        .json(ApiResponse.success('Support tickets fetched successfully', result));
    } catch (error) {
      next(error);
    }
  }

  async getTicketById(req, res, next) {
    try {
      const ticket = await supportService.getTicketById(
        req.params.id,
        req.user._id,
        req.user.role
      );

      res
        .status(200)
        .json(ApiResponse.success('Support ticket fetched successfully', { ticket }));
    } catch (error) {
      next(error);
    }
  }

  async replyTicket(req, res, next) {
    try {
      const ticket = await supportService.replyTicket(
        req.params.id,
        req.user._id,
        req.user.role,
        req.body
      );

      res
        .status(200)
        .json(ApiResponse.success('Reply added successfully', { ticket }));
    } catch (error) {
      next(error);
    }
  }

  async updateTicketStatus(req, res, next) {
    try {
      const ticket = await supportService.updateTicketStatus(
        req.params.id,
        req.user._id,
        req.user.role,
        req.body
      );

      res
        .status(200)
        .json(ApiResponse.success('Support ticket updated successfully', { ticket }));
    } catch (error) {
      next(error);
    }
  }

  async deleteTicket(req, res, next) {
    try {
      const ticket = await supportService.deleteTicket(
        req.params.id,
        req.user.role
      );

      res
        .status(200)
        .json(ApiResponse.success('Support ticket deleted successfully', { ticket }));
    } catch (error) {
      next(error);
    }
  }

  async getSupportStats(req, res, next) {
    try {
      const stats = await supportService.getSupportStats(req.user.role);

      res
        .status(200)
        .json(ApiResponse.success('Support stats fetched successfully', { stats }));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SupportController();