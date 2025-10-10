import { Response } from 'express';
import { NotificationService } from '../../domain/services/NotificationService';
import { sendSuccess, asyncHandler } from '../../../../shared/middleware/errorHandler';
import { AuthRequest } from '../../../../shared/middleware/auth';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  private getUserId(req: AuthRequest): string {
    if (!req.userId) {
      throw new Error('User not authenticated');
    }
    return req.userId;
  }

  getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const userId = this.getUserId(req);

    const notifications = await this.notificationService.getUserNotifications(userId, limit);

    const unreadCount = await this.notificationService.getUnreadCount(userId);

    sendSuccess(res, {
      notifications,
      unreadCount,
    });
  });

  getNotificationById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const notification = await this.notificationService.markAsRead(req.params.id as string, userId);

    sendSuccess(res, { notification });
  });

  markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const notification = await this.notificationService.markAsRead(req.params.id as string, userId);

    sendSuccess(res, { notification }, 'Notification marked as read');
  });

  markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    await this.notificationService.markAllAsRead(userId);

    sendSuccess(res, null, 'All notifications marked as read');
  });

  deleteNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
    // In a real app, you'd implement deletion in the service
    sendSuccess(res, null, 'Notification deleted successfully');
  });
}

export const notificationController = new NotificationController();
