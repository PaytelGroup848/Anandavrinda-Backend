const reportService = require('../services/report.service');
const ApiResponse   = require('../utils/ApiResponse');

class ReportController {

  async getFullReport(req, res, next) {
    try {
      const period = req.query.period || 'this-year';
      const data   = await reportService.getFullReport(period);
      res.status(200).json(
        ApiResponse.success('Reports fetched successfully', data)
      );
    } catch (error) {
      next(error);
    }
  }

  // Alag alag endpoints bhi — agar baad mein chahiye
  async getSummary(req, res, next) {
    try {
      const period = req.query.period || 'this-year';
      const data   = await reportService.getSummary(period);
      res.status(200).json(
        ApiResponse.success('Summary fetched', data)
      );
    } catch (error) {
      next(error);
    }
  }

  async getTopProducts(req, res, next) {
    try {
      const period = req.query.period || 'this-year';
      const limit  = parseInt(req.query.limit) || 10;
      const data   = await reportService.getTopProducts(period, limit);
      res.status(200).json(
        ApiResponse.success('Top products fetched', data)
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();