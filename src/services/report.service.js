const Order = require('../models/order.model');
const { getDateRange } = require('../utils/dataRange');

// Sirf ye statuses revenue mein count honge
const PAID_STATUSES = ['confirmed', 'processing', 'shipped', 
                       'out_for_delivery', 'delivered'];

class ReportService {

  // ── 1. Summary Cards ──────────────────────────────
  async getSummary(period) {
    const { start, end } = getDateRange(period);

    const [result, prevResult] = await Promise.all([
      // Current period
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            'payment.status': 'success',
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue:  { $sum: '$pricing.totalAmount' },
            totalOrders:   { $sum: 1 },
            avgOrderValue: { $avg: '$pricing.totalAmount' },
          }
        }
      ]),

      // Previous period (comparison ke liye)
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(start.getTime() - (end - start)),
              $lt: start,
            },
            'payment.status': 'success',
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$pricing.totalAmount' },
            totalOrders:  { $sum: 1 },
          }
        }
      ])
    ]);

    const curr = result[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };
    const prev = prevResult[0] || { totalRevenue: 0, totalOrders: 0 };

    // Top category nikalo
    const topCat = await this.getTopCategory(start, end);

    // % change calculate karo
    const revenueChange = prev.totalRevenue > 0
      ? Math.round(((curr.totalRevenue - prev.totalRevenue) / prev.totalRevenue) * 100)
      : 0;

    const ordersChange = prev.totalOrders > 0
      ? Math.round(((curr.totalOrders - prev.totalOrders) / prev.totalOrders) * 100)
      : 0;

    return {
      totalRevenue:   Math.round(curr.totalRevenue),
      totalOrders:    curr.totalOrders,
      avgOrderValue:  Math.round(curr.avgOrderValue || 0),
      topCategory:    topCat,
      revenueChange,
      ordersChange,
    };
  }

  // ── 2. Top Category Helper ────────────────────────
  async getTopCategory(start, end) {
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          'payment.status': 'success',
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product',
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category',
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$category._id',
          name: { $first: '$category.name' },
          revenue: { $sum: '$items.totalPrice' },
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 1 },
    ]);

    return result[0]?.name || 'N/A';
  }

  // ── 3. Revenue Over Time ──────────────────────────
  async getRevenueOverTime(period) {
    const { start, end } = getDateRange(period);

    // Period ke hisaab se group karo
    let groupBy;
    let dateFormat;

    if (period === 'today') {
      // Hour wise
      groupBy = { hour: { $hour: '$createdAt' } };
      dateFormat = (doc) => `${doc._id.hour}:00`;
    } else if (period === 'this-week') {
      // Day wise
      groupBy = {
        day: { $dayOfMonth: '$createdAt' },
        month: { $month: '$createdAt' },
      };
      dateFormat = (doc) => `${doc._id.day}/${doc._id.month}`;
    } else if (period === 'this-month') {
      // Day wise
      groupBy = { day: { $dayOfMonth: '$createdAt' } };
      dateFormat = (doc) => `Day ${doc._id.day}`;
    } else {
      // Month wise
      groupBy = {
        month: { $month: '$createdAt' },
        year: { $year: '$createdAt' },
      };
      dateFormat = (doc) => {
        const months = ['Jan','Feb','Mar','Apr','May','Jun',
                        'Jul','Aug','Sep','Oct','Nov','Dec'];
        return months[(doc._id.month || 1) - 1];
      };
    }

    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          'payment.status': 'success',
        }
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$pricing.totalAmount' },
          orders:  { $sum: 1 },
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
    ]);

    return result.map(doc => ({
      month:   dateFormat(doc),
      revenue: Math.round(doc.revenue),
      orders:  doc.orders,
    }));
  }

  // ── 4. Sales by Category ──────────────────────────
  async getSalesByCategory(period) {
    const { start, end } = getDateRange(period);

    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          'payment.status': 'success',
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product',
          pipeline: [{ $project: { category: 1 } }],
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category',
          pipeline: [{ $project: { name: 1 } }],
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$category._id',
          name:       { $first: { $ifNull: ['$category.name', 'Uncategorized'] } },
          sales:      { $sum: '$items.totalPrice' },
          unitsSold:  { $sum: '$items.quantity' },
          orders:     { $sum: 1 },
        }
      },
      { $sort: { sales: -1 } },
      { $limit: 8 },
    ]);

    return result.map(doc => ({
      name:      doc.name,
      sales:     Math.round(doc.sales),
      unitsSold: doc.unitsSold,
      orders:    doc.orders,
    }));
  }

  // ── 5. Order Status Distribution ─────────────────
  async getOrderStatusDistribution(period) {
    const { start, end } = getDateRange(period);

    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        }
      },
      {
        $group: {
          _id:   '$status',
          value: { $sum: 1 },
        }
      },
      { $sort: { value: -1 } },
    ]);

    return result.map(doc => ({
      name:  doc._id,
      value: doc.value,
    }));
  }

  // ── 6. Vendor Revenue ─────────────────────────────
  async getVendorRevenue(period) {
    const { start, end } = getDateRange(period);

    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          'payment.status': 'success',
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'users',
          localField: 'items.vendor',
          foreignField: '_id',
          as: 'vendorUser',
          pipeline: [{ $project: { name: 1 } }],
        }
      },
      { $unwind: { path: '$vendorUser', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id:     '$items.vendor',
          name:    { $first: { $ifNull: ['$vendorUser.name', 'Admin'] } },
          revenue: { $sum: '$items.totalPrice' },
          orders:  { $sum: 1 },
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 7 },
    ]);

    return result.map(doc => ({
      name:    doc.name,
      revenue: Math.round(doc.revenue),
      orders:  doc.orders,
    }));
  }

  // ── 7. Top Selling Products ───────────────────────
  async getTopProducts(period, limit = 10) {
    const { start, end } = getDateRange(period);

    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          'payment.status': 'success',
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id:       '$items.product',
          name:      { $first: '$items.productSnapshot.name' },
          unitsSold: { $sum: '$items.quantity' },
          revenue:   { $sum: '$items.totalPrice' },
        }
      },
      { $sort: { unitsSold: -1 } },
      { $limit: limit },
      // Category bhi chahiye
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
          pipeline: [{
            $lookup: {
              from: 'categories',
              localField: 'category',
              foreignField: '_id',
              as: 'categoryData',
              pipeline: [{ $project: { name: 1 } }],
            }
          }],
        }
      },
      {
        $project: {
          name:      1,
          unitsSold: 1,
          revenue:   1,
          category: {
            $ifNull: [
              { $arrayElemAt: ['$product.categoryData.name', 0] },
              'Uncategorized'
            ]
          }
        }
      }
    ]);

    return result.map(doc => ({
      name:      doc.name || 'Unknown Product',
      category:  doc.category,
      unitsSold: doc.unitsSold,
      revenue:   Math.round(doc.revenue),
    }));
  }

  // ── 8. Full Report (Sab ek saath) ─────────────────
  async getFullReport(period = 'this-year') {
    // Parallel mein sab run karo — fast
    const [
      summary,
      revenueByMonth,
      categorySales,
      orderStatusDistribution,
      vendorSales,
      topProducts,
    ] = await Promise.all([
      this.getSummary(period),
      this.getRevenueOverTime(period),
      this.getSalesByCategory(period),
      this.getOrderStatusDistribution(period),
      this.getVendorRevenue(period),
      this.getTopProducts(period),
    ]);

    return {
      summary,
      revenueByMonth,
      categorySales,
      orderStatusDistribution,
      vendorSales,
      topProducts,
    };
  }
}

module.exports = new ReportService();