const contactService = require('../services/contact.service');
const ApiResponse = require('../utils/ApiResponse');

class ContactController {
  async submitQuery(req, res, next) {
    try {
      const meta = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      };

      const query = await contactService.createQuery(req.body, meta);

      res
        .status(201)
        .json(ApiResponse.success('Message sent successfully', { query }));
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await contactService.getStats();

      res
        .status(200)
        .json(ApiResponse.success('Contact stats fetched successfully', { stats }));
    } catch (error) {
      next(error);
    }
  }

  async getQueries(req, res, next) {
    try {
      const result = await contactService.getQueries(req.query);

      res
        .status(200)
        .json(ApiResponse.success('Contact queries fetched successfully', result));
    } catch (error) {
      next(error);
    }
  }

  async getQueryById(req, res, next) {
    try {
      const query = await contactService.getQueryById(req.params.id);

      res
        .status(200)
        .json(ApiResponse.success('Contact query fetched successfully', { query }));
    } catch (error) {
      next(error);
    }
  }

  async updateQuery(req, res, next) {
    try {
      const query = await contactService.updateQuery(req.params.id, req.body);

      res
        .status(200)
        .json(ApiResponse.success('Contact query updated successfully', { query }));
    } catch (error) {
      next(error);
    }
  }

  async deleteQuery(req, res, next) {
    try {
      await contactService.deleteQuery(req.params.id);

      res
        .status(200)
        .json(ApiResponse.success('Contact query deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ContactController();
