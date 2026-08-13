const express = require('express');
const router = express.Router();

const supportController = require('../../controllers/support.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

router.use(protect);

// Admin stats
router.get(
  '/admin/stats',
  restrictTo('super_admin', 'sub_admin', 'admin'),
  supportController.getSupportStats
);

// Create ticket - customer/vendor/admin all can create
router.post('/', supportController.createTicket);

// List tickets
// Admin ko all tickets milenge, customer ko sirf apne tickets milenge
router.get('/', supportController.getTickets);

// Single ticket
router.get('/:id', supportController.getTicketById);

// Reply ticket
router.post('/:id/reply', supportController.replyTicket);

// Admin update status / priority / assignedTo
router.patch(
  '/:id',
  restrictTo('super_admin', 'sub_admin', 'admin'),
  supportController.updateTicketStatus
);

// Admin delete ticket
router.delete(
  '/:id',
  restrictTo('super_admin', 'sub_admin', 'admin'),
  supportController.deleteTicket
);

module.exports = router;