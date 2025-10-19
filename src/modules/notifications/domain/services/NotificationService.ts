import { Notification } from "../../domain/models/Notification";
import logger from '../../../../shared/infrastructure/logging';

/**
 * NotificationService - Business logic for notification management
 * 
 * Handles notification creation, delivery, and read status management.
 * Supports multiple notification types (system, match, friend, tournament, team, chat).
 * Integrates with real-time delivery systems for instant push notifications.
 * 
 * Features:
 * - Multi-channel notification delivery
 * - Read/unread status tracking
 * - Bulk operations for efficiency
 * - Notification history management
 * - Unread counter functionality
 */
export class NotificationService {
  /**
   * Create a new notification for a user
   * 
   * Creates and saves a notification with specified type and content.
   * Logs the creation for audit purposes. Can include custom data payload
   * for rich notifications. Integrates with real-time push systems.
   * 
   * @async
   * @param {string} userId - Target user ID to receive the notification
   * @param {string} type - Notification type (system, match, friend, tournament, team, chat)
   * @param {string} title - Notification title/heading
   * @param {string} message - Notification message content
   * @param {any} [data] - Optional custom data payload for rich notifications
   * @returns {Promise<Notification>} Created notification document
   * 
   * @example
   * await notificationService.createNotification(
   *   userId,
   *   'match',
   *   'Match Starting Soon',
   *   'Your football match starts in 30 minutes',
   *   { matchId: '123', sport: 'football' }
   * );
   */
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any
  ) {
    const notification = new Notification({
      user: userId,
      type,
      title,
      message,
      data,
    });

    await notification.save();

    logger.info(`Notification created for user: ${userId}`, {
      notificationId: notification.id,
      type,
    });

    return notification;
  }

  /**
   * Mark a specific notification as read
   * 
   * Updates the read status of a single notification for the specified user.
   * Validates that the notification belongs to the user before updating.
   * Returns null if notification not found or doesn't belong to user.
   * 
   * @async
   * @param {string} notificationId - Notification ID to mark as read
   * @param {string} userId - User ID (for authorization check)
   * @returns {Promise<Notification | null>} Updated notification or null if not found
   * 
   * @example
   * const notification = await notificationService.markAsRead(notificationId, userId);
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId,
    });

    if (notification) {
      notification.read = true;
      await notification.save();
    }

    return notification;
  }

  /**
   * Mark all unread notifications as read for a user
   * 
   * Bulk operation to update read status for all unread notifications.
   * Efficient database operation using updateMany. Does not return
   * individual notifications, only updates the database.
   * 
   * @async
   * @param {string} userId - User ID whose notifications to mark as read
   * @returns {Promise<void>}
   * 
   * @example
   * await notificationService.markAllAsRead(userId);
   */
  async markAllAsRead(userId: string) {
    await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );
  }

  /**
   * Retrieve user's notifications with pagination
   * 
   * Fetches notifications for a user sorted by creation date (newest first).
   * Supports pagination via limit parameter. Returns both read and unread
   * notifications unless filtered at controller level.
   * 
   * @async
   * @param {string} userId - User ID whose notifications to retrieve
   * @param {number} [limit=50] - Maximum number of notifications to return
   * @returns {Promise<Notification[]>} Array of notification documents
   * 
   * @example
   * const notifications = await notificationService.getUserNotifications(userId, 20);
   */
  async getUserNotifications(userId: string, limit: number = 50) {
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return notifications;
  }

  /**
   * Get count of unread notifications for a user
   * 
   * Efficiently counts unread notifications using database aggregation.
   * Used for notification badge display in UI. Does not retrieve
   * actual notification documents.
   * 
   * @async
   * @param {string} userId - User ID to count unread notifications for
   * @returns {Promise<number>} Count of unread notifications
   * 
   * @example
   * const unreadCount = await notificationService.getUnreadCount(userId);
   * // Returns: 5
   */
  async getUnreadCount(userId: string) {
    const count = await Notification.countDocuments({
      user: userId,
      read: false,
    });

    return count;
  }
}
