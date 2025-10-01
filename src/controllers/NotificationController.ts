import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import {
  NotFoundError,
  ConflictError,
  sendSuccess,
  sendCreated,
  asyncHandler,
} from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { validatePagination } from '../middleware/validation';
import { NotificationType } from '../types';

/**
 * NotificationController handles all notification-related operations
 * including creating, retrieving, and managing user notifications.
 *
 * Features:
 * - Real-time notifications via Socket.IO
 * - User notification preferences management
 * - Notification filtering and pagination
 * - Mark as read/unread functionality
 * - Notification statistics and analytics
 *
 * @author Sports Companion Team
 * @version 1.0.0
 */

export class NotificationController {
  // Get user's notifications
  static getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, skip } = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );

    const filter: any = { user: req.userId };

    // Filter by read status
    if (req.query.read !== undefined) {
      filter.read = req.query.read === 'true';
    }

    // Filter by type
    if (req.query.type) {
      filter.type = req.query.type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('relatedEntity.id', 'name title')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: req.userId, read: false }),
    ]);

    sendSuccess(res, {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  // Get notification by ID
  static getNotificationById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.userId,
    }).populate('relatedEntity.id', 'name title');

    if (!notification) {
      throw new NotFoundError('Notification');
    }

    sendSuccess(res, { notification });
  });

  // Mark notification as read
  static markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!notification) {
      throw new NotFoundError('Notification');
    }

    if (notification.read) {
      throw new ConflictError('Notification is already marked as read');
    }

    notification.read = true;
    await notification.save();

    sendSuccess(res, { notification }, 'Notification marked as read');
  });

  // Mark all notifications as read
  static markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await Notification.updateMany({ user: req.userId, read: false }, { read: true });

    sendSuccess(
      res,
      {
        modifiedCount: result.modifiedCount,
      },
      'All notifications marked as read'
    );
  });

  // Delete notification
  static deleteNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!notification) {
      throw new NotFoundError('Notification');
    }

    await Notification.findByIdAndDelete(req.params.id);

    sendSuccess(res, null, 'Notification deleted successfully');
  });

  // Delete all read notifications
  static deleteAllRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await Notification.deleteMany({
      user: req.userId,
      read: true,
    });

    sendSuccess(
      res,
      {
        deletedCount: result.deletedCount,
      },
      'All read notifications deleted'
    );
  });

  // Create notification (internal/admin use)
  static createNotification = asyncHandler(async (req: Request, res: Response) => {
    const { userId, type, title, message, action, relatedEntity, expiresAt } = req.body;

    const notification = new Notification({
      user: userId,
      type: type || NotificationType.SYSTEM,
      title: title.trim(),
      message: message.trim(),
      action: action || {},
      relatedEntity,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      timestamp: new Date(),
      read: false,
    });

    await notification.save();
    await notification.populate('user', 'profile');

    // Send real-time notification via Socket.IO
    const io = (req.app as any).locals.io;
    if (io) {
      io.to(`user:${userId}`).emit('notification', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        action: notification.action,
        timestamp: notification.timestamp,
        read: notification.read,
      });
    }

    sendCreated(res, { notification }, 'Notification created successfully');
  });

  // Get notification statistics
  static getNotificationStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await Notification.aggregate([
      { $match: { user: req.userId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          unread: { $sum: { $cond: ['$read', 0, 1] } },
        },
      },
    ]);

    const totalStats = await Notification.aggregate([
      { $match: { user: req.userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: ['$read', 0, 1] } },
        },
      },
    ]);

    sendSuccess(res, {
      byType: stats,
      overall: totalStats[0] || { total: 0, unread: 0 },
    });
  });

  // Update notification preferences
  static updatePreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { emailNotifications, pushNotifications, types } = req.body;
    const userId = req.userId!;

    // Get the user and update their preferences
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Initialize preferences if not exists
    if (!user.preferences) {
      user.preferences = {};
    }

    // Update notification preferences
    const notificationPrefs = {
      emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
      pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
      types: types || Object.values(NotificationType),
    };

    user.preferences.notifications = notificationPrefs;
    await user.save();

    sendSuccess(
      res,
      {
        preferences: notificationPrefs,
      },
      'Notification preferences updated successfully'
    );
  });
}
