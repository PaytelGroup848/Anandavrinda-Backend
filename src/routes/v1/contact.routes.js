const express = require('express');
const router = express.Router();

const contactController = require('../../controllers/contact.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// Public - contact form submission
router.post('/', contactController.submitQuery);

// Admin routes
router.use(protect);
router.use(restrictTo('super_admin', 'sub_admin', 'admin'));

router.get('/admin/stats', contactController.getStats);
router.get('/', contactController.getQueries);
router.get('/:id', contactController.getQueryById);
router.patch('/:id', contactController.updateQuery);
router.delete('/:id', contactController.deleteQuery);

module.exports = router;
