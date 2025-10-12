/**
 * Notification Queue System
 *
 * Handles async notification processing with retry logic
 */

// Update the import path to the correct location of Notification model
import { Notification } from '@/modules/notifications/domain/models/Notification';
import { NotificationType } from '../../types';
import logger from '../../infrastructure/logging';
import cacheService from '../../infrastructure/cache';

export interface QueuedNotification {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  scheduledFor?: Date;
}

export class NotificationQueue {
  private static readonly QUEUE_KEY = 'notification:queue';
  private static readonly PROCESSING_KEY = 'notification:processing';
  private static readonly FAILED_KEY = 'notification:failed';

  /**
   * Add notification to queue
   */
  static async enqueue(notification: QueuedNotification): Promise<void> {
    try {
      const priority = notification.priority || 'normal';
      const score = this.calculateScore(priority, notification.scheduledFor);

      // Store in Redis sorted set
      const notificationData = JSON.stringify(notification);
      await cacheService.redis.zadd(this.QUEUE_KEY, score, notificationData);

      logger.info(`Notification queued for user ${notification.userId}`);
    } catch (error) {
      logger.error('Failed to enqueue notification:', error);
      throw error;
    }
  }

  /**
   * Batch enqueue multiple notifications
   */
  static async enqueueBatch(notifications: QueuedNotification[]): Promise<void> {
    try {
      const pipeline = cacheService.redis.pipeline();

      for (const notification of notifications) {
        const priority = notification.priority || 'normal';
        const score = this.calculateScore(priority, notification.scheduledFor);
        const notificationData = JSON.stringify(notification);

        pipeline.zadd(this.QUEUE_KEY, score, notificationData);
      }

      await pipeline.exec();

      logger.info(`Batch queued ${notifications.length} notifications`);
    } catch (error) {
      logger.error('Failed to batch enqueue notifications:', error);
      throw error;
    }
  }

  /**
   * Process notifications from queue
   */
  static async process(limit: number = 100): Promise<number> {
    try {
      const now = Date.now();

      // Get notifications ready to be processed
      const notifications = await cacheService.redis.zrangebyscore(
        this.QUEUE_KEY,
        0,
        now,
        'LIMIT',
        0,
        limit
      );

      if (notifications.length === 0) {
        return 0;
      }

      let processed = 0;

      for (const notificationData of notifications) {
        try {
          const notification: QueuedNotification = JSON.parse(notificationData);

          // Create notification in database
          await Notification.create({
            user: notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            read: false,
          });

          // Remove from queue
          await cacheService.redis.zrem(this.QUEUE_KEY, notificationData);

          processed++;
        } catch (error) {
          logger.error('Failed to process notification:', error);

          // Move to failed queue
          await cacheService.redis.zadd(this.FAILED_KEY, Date.now(), notificationData);
          await cacheService.redis.zrem(this.QUEUE_KEY, notificationData);
        }
      }

      logger.info(`Processed ${processed} notifications from queue`);
      return processed;
    } catch (error) {
      logger.error('Failed to process notification queue:', error);
      return 0;
    }
  }

  /**
   * Retry failed notifications
   */
  static async retryFailed(maxRetries: number = 3): Promise<number> {
    try {
      const failed = await cacheService.redis.zrange(this.FAILED_KEY, 0, -1);
      let retried = 0;

      for (const notificationData of failed) {
        const notification: QueuedNotification = JSON.parse(notificationData);

        // Check retry count
        const retryCount = await cacheService.get<number>(
          `notification:retry:${notification.userId}`
        );

        if ((retryCount || 0) < maxRetries) {
          // Re-queue
          await this.enqueue(notification);

          // Increment retry count
          await cacheService.set(
            `notification:retry:${notification.userId}`,
            (retryCount || 0) + 1,
            3600
          );

          // Remove from failed
          await cacheService.redis.zrem(this.FAILED_KEY, notificationData);

          retried++;
        }
      }

      logger.info(`Retried ${retried} failed notifications`);
      return retried;
    } catch (error) {
      logger.error('Failed to retry notifications:', error);
      return 0;
    }
  }

  /**
   * Get queue statistics
   */
  static async getStats(): Promise<{
    queued: number;
    processing: number;
    failed: number;
  }> {
    try {
      const [queued, processing, failed] = await Promise.all([
        cacheService.redis.zcard(this.QUEUE_KEY),
        cacheService.redis.zcard(this.PROCESSING_KEY),
        cacheService.redis.zcard(this.FAILED_KEY),
      ]);

      return { queued, processing, failed };
    } catch (error) {
      logger.error('Failed to get queue stats:', error);
      return { queued: 0, processing: 0, failed: 0 };
    }
  }

  /**
   * Clear all queues
   */
  static async clear(): Promise<void> {
    try {
      await Promise.all([
        cacheService.redis.del(this.QUEUE_KEY),
        cacheService.redis.del(this.PROCESSING_KEY),
        cacheService.redis.del(this.FAILED_KEY),
      ]);

      logger.info('Cleared notification queues');
    } catch (error) {
      logger.error('Failed to clear queues:', error);
    }
  }

  /**
   * Calculate priority score for sorted set
   */
  private static calculateScore(priority: 'low' | 'normal' | 'high', scheduledFor?: Date): number {
    const now = Date.now();
    const scheduled = scheduledFor ? scheduledFor.getTime() : now;

    // Priority multipliers
    const priorityMultiplier = {
      high: 0.5,
      normal: 1,
      low: 2,
    };

    return scheduled * priorityMultiplier[priority];
  }
}

/**
 * Start notification queue processor
 */
export const startNotificationProcessor = (intervalMs: number = 5000): NodeJS.Timer => {
  logger.info('Starting notification queue processor');

  return setInterval(async () => {
    try {
      const processed = await NotificationQueue.process();

      if (processed > 0) {
        logger.debug(`Notification processor: processed ${processed} notifications`);
      }

      // Retry failed notifications every 10 cycles
      if (Math.random() < 0.1) {
        await NotificationQueue.retryFailed();
      }
    } catch (error) {
      logger.error('Notification processor error:', error);
    }
  }, intervalMs);
};
