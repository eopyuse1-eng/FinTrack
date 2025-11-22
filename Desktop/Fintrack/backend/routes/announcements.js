const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const announcementController = require('../controllers/announcementController');

// All routes require authentication
router.use(authMiddleware);

// Get unread count (must be before /:id route)
router.get('/count/unread', announcementController.getUnreadCount);

// Mark all as read (must be before /:id route)
router.post('/read/all', announcementController.markAllAsRead);

// Create announcement (HR Head only)
router.post('/', (req, res, next) => {
  if (req.user.role !== 'hr_head') {
    return res.status(403).json({
      success: false,
      message: 'Only HR Head can create announcements',
    });
  }
  next();
}, announcementController.createAnnouncement);

// Get all announcements
router.get('/', announcementController.getAnnouncements);

// Get single announcement (after specific routes)
router.get('/:id', announcementController.getAnnouncementById);

// Mark as read
router.post('/:id/read', announcementController.markAsRead);

// Delete announcement
router.delete('/:id', announcementController.deleteAnnouncement);

module.exports = router;
