import { Notification } from "../../domain/models/Notification";
import logger from "../../../../shared/utils/logger";

export class NotificationService {
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

  async markAllAsRead(userId: string) {
    await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );
  }

  async getUserNotifications(userId: string, limit: number = 50) {
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return notifications;
  }

  async getUnreadCount(userId: string) {
    const count = await Notification.countDocuments({
      user: userId,
      read: false,
    });

    return count;
  }
}
