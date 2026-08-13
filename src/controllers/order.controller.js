const orderService = require('../services/order.service');
const ApiResponse = require('../utils/ApiResponse');

class OrderController {
  // Create order from cart
  async createOrder(req, res, next) {
    try {
      const order = await orderService.createOrder(req.user._id, req.body);
      res.status(201).json(
        ApiResponse.success('Order created successfully', { order })
      );
    } catch (error) {
      next(error);
    }
  }

  // Get user orders
  async getUserOrders(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await orderService.getUserOrders(req.user._id, parseInt(page), parseInt(limit));
      res.status(200).json(
        ApiResponse.success('Orders fetched successfully', result)
      );
    } catch (error) {
      next(error);
    }
  }

  // Get order by ID
  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id, req.user._id, req.user.role);
      res.status(200).json(
        ApiResponse.success('Order fetched successfully', { order })
      );
    } catch (error) {
      next(error);
    }
  }

  // Get order by order ID string
  async getOrderByOrderId(req, res, next) {
    try {
      const { orderId } = req.params;
      const order = await orderService.getOrderByOrderId(orderId, req.user._id, req.user.role);
      res.status(200).json(
        ApiResponse.success('Order fetched successfully', { order })
      );
    } catch (error) {
      next(error);
    }
  }

  // Cancel order
  async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const order = await orderService.cancelOrder(id, req.user._id, req.user.role, reason);
      res.status(200).json(
        ApiResponse.success('Order cancelled successfully', { order })
      );
    } catch (error) {
      next(error);
    }
  }

  // Get all orders (Admin only)
  async getAllOrders(req, res, next) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const result = await orderService.getAllOrders(parseInt(page), parseInt(limit), { status });
      res.status(200).json(
        ApiResponse.success('Orders fetched successfully', result)
      );
    } catch (error) {
      next(error);
    }
  }

  // Update order status (Admin only)
 async updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const order = await orderService.updateOrderStatus(
      id,
      status,
      req.user._id,
      req.user.role,
      reason
    );

    res.status(200).json(
      ApiResponse.success('Order status updated successfully', { order })
    );
  } catch (error) {
    next(error);
  }
}

async deleteOrder(req, res, next) {
  try {
    const { id } = req.params;

    const order = await orderService.deleteOrder(id, req.user.role);

    res.status(200).json(
      ApiResponse.success('Order deleted successfully', { order })
    );
  } catch (error) {
    next(error);
  }
}

  // Fake payment done for testing
async markPaymentDoneTest(req, res, next) {
  try {
    const { id } = req.params;

    const order = await orderService.markPaymentDoneTest(
      id,
      req.user._id,
      req.user.role
    );

    res.status(200).json(
      ApiResponse.success('Payment marked as done successfully', { order })
    );
  } catch (error) {
    next(error);
  }
}
}

module.exports = new OrderController();