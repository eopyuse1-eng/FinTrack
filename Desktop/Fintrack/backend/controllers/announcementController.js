const Announcement = require('../models/Announcement');
const { AuditLog } = require('../models/AuditLog');

// Create announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, priority, targetRoles, expiresAt } = req.body;
    const userId = req.user.id;

    // Validation
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
      });
    }

    if (!['low', 'normal', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority level',
      });
    }

    const announcement = new Announcement({
      title,
      content,
      priority,
      createdBy: userId,
      targetRoles: targetRoles || ['employee', 'supervisor', 'hr_head', 'treasury'],
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await announcement.save();
    await announcement.populate('createdBy', 'firstName lastName email');

    // Log to audit
    await AuditLog.create({
      model: 'Announcement',
      action: 'created',
      userId,
      details: {
        announcementId: announcement._id,
        title: announcement.title,
        priority: announcement.priority,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement,
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement',
      error: error.message,
    });
  }
};

// Get all announcements for user
exports.getAnnouncements = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { page = 1, limit = 10 } = req.query;

    const query = {
      isActive: true,
      expiresAt: { $gt: new Date() },
      $or: [
        { targetRoles: userRole },
        { targetRoles: { $in: ['employee', 'supervisor', 'hr_head', 'treasury'] } },
      ],
    };

    const skip = (page - 1) * limit;

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Announcement.countDocuments(query);

    // Map with read status
    const announcementsWithReadStatus = announcements.map(announcement => {
      const isRead = announcement.readBy.some(
        r => r.user.toString() === userId
      );
      return {
        ...announcement.toObject(),
        isRead,
      };
    });

    res.status(200).json({
      success: true,
      data: announcementsWithReadStatus,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: error.message,
    });
  }
};

// Get single announcement
exports.getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const announcement = await Announcement.findById(id).populate(
      'createdBy',
      'firstName lastName email'
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    const isRead = announcement.readBy.some(r => r.user.toString() === userId);

    res.status(200).json({
      success: true,
      data: {
        ...announcement.toObject(),
        isRead,
      },
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcement',
      error: error.message,
    });
  }
};

// Mark announcement as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    // Check if already read
    const alreadyRead = announcement.readBy.some(
      r => r.user.toString() === userId
    );

    if (!alreadyRead) {
      announcement.readBy.push({
        user: userId,
        readAt: new Date(),
      });
      await announcement.save();
    }

    res.status(200).json({
      success: true,
      message: 'Announcement marked as read',
    });
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark announcement as read',
      error: error.message,
    });
  }
};

// Mark all announcements as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const query = {
      isActive: true,
      expiresAt: { $gt: new Date() },
      $or: [
        { targetRoles: userRole },
        { targetRoles: { $in: ['employee', 'supervisor', 'hr_head', 'treasury'] } },
      ],
      'readBy.user': { $ne: userId },
    };

    await Announcement.updateMany(
      query,
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date(),
          },
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'All announcements marked as read',
    });
  } catch (error) {
    console.error('Error marking all announcements as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all announcements as read',
      error: error.message,
    });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const query = {
      isActive: true,
      expiresAt: { $gt: new Date() },
      $or: [
        { targetRoles: userRole },
        { targetRoles: { $in: ['employee', 'supervisor', 'hr_head', 'treasury'] } },
      ],
      'readBy.user': { $ne: userId },
    };

    const unreadCount = await Announcement.countDocuments(query);

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message,
    });
  }
};

// Delete announcement (soft delete)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    // Only creator can delete
    if (announcement.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this announcement',
      });
    }

    await Announcement.findByIdAndUpdate(id, { isActive: false });

    // Log to audit
    await AuditLog.create({
      model: 'Announcement',
      action: 'deleted',
      userId,
      details: {
        announcementId: announcement._id,
        title: announcement.title,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete announcement',
      error: error.message,
    });
  }
};
