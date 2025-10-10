/**
 * Webhook System
 *
 * Allows external systems to subscribe to events via webhooks
 */

import axios from 'axios';
import crypto from 'crypto';
import logger from './logger';
import cacheService from './cache';

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  retryAttempts?: number;
  lastDeliveredAt?: Date;
}

export interface WebhookPayload {
  event: string;
  timestamp: Date;
  data: any;
  signature?: string;
}

export class WebhookService {
  private static readonly WEBHOOK_KEY = 'webhooks:subscriptions';
  private static readonly DELIVERY_LOG_KEY = 'webhooks:delivery:log';
  private static readonly FAILED_QUEUE_KEY = 'webhooks:failed';

  /**
   * Register a webhook subscription
   */
  static async subscribe(
    url: string,
    events: string[],
    secret?: string
  ): Promise<WebhookSubscription> {
    const subscription: WebhookSubscription = {
      id: crypto.randomBytes(16).toString('hex'),
      url,
      events,
      secret: secret || crypto.randomBytes(32).toString('hex'),
      active: true,
      retryAttempts: 0,
    };

    // Store subscription
    const subscriptions = await this.getAllSubscriptions();
    subscriptions.push(subscription);

    await cacheService.set(this.WEBHOOK_KEY, subscriptions);

    logger.info(`Webhook subscription created: ${subscription.id} for ${url}`);

    return subscription;
  }

  /**
   * Unsubscribe a webhook
   */
  static async unsubscribe(subscriptionId: string): Promise<boolean> {
    const subscriptions = await this.getAllSubscriptions();
    const filtered = subscriptions.filter((s) => s.id !== subscriptionId);

    if (filtered.length === subscriptions.length) {
      return false; // Subscription not found
    }

    await cacheService.set(this.WEBHOOK_KEY, filtered);

    logger.info(`Webhook subscription removed: ${subscriptionId}`);

    return true;
  }

  /**
   * Get all active subscriptions for an event
   */
  static async getSubscriptionsForEvent(event: string): Promise<WebhookSubscription[]> {
    const subscriptions = await this.getAllSubscriptions();

    return subscriptions.filter(
      (s) => s.active && (s.events.includes(event) || s.events.includes('*'))
    );
  }

  /**
   * Deliver webhook to a subscriber
   */
  static async deliver(
    subscription: WebhookSubscription,
    payload: WebhookPayload
  ): Promise<boolean> {
    try {
      // Generate signature
      const signature = this.generateSignature(payload, subscription.secret);
      payload.signature = signature;

      // Send webhook
      const response = await axios.post(subscription.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': payload.event,
        },
        timeout: 10000, // 10 seconds
      });

      // Log successful delivery
      await this.logDelivery(subscription.id, payload, true, response.status);

      logger.info(`Webhook delivered to ${subscription.url} for event ${payload.event}`);

      return true;
    } catch (error: any) {
      // Log failed delivery
      await this.logDelivery(
        subscription.id,
        payload,
        false,
        error.response?.status,
        error.message
      );

      logger.error(
        `Webhook delivery failed to ${subscription.url} for event ${payload.event}:`,
        error.message
      );

      // Queue for retry
      await this.queueForRetry(subscription, payload);

      return false;
    }
  }

  /**
   * Broadcast event to all subscribers
   */
  static async broadcast(event: string, data: any): Promise<number> {
    const subscriptions = await this.getSubscriptionsForEvent(event);

    if (subscriptions.length === 0) {
      return 0;
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date(),
      data,
    };

    let successCount = 0;

    // Deliver to all subscribers in parallel
    const results = await Promise.allSettled(
      subscriptions.map((sub) => this.deliver(sub, payload))
    );

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        successCount++;
      }
    });

    logger.info(
      `Broadcast ${event}: delivered to ${successCount}/${subscriptions.length} subscribers`
    );

    return successCount;
  }

  /**
   * Retry failed webhooks
   */
  static async retryFailed(maxRetries: number = 3): Promise<number> {
    try {
      const failedItems = await cacheService.redis.lrange(this.FAILED_QUEUE_KEY, 0, -1);

      let retried = 0;

      for (const itemData of failedItems) {
        const item = JSON.parse(itemData);

        if (item.retryCount < maxRetries) {
          const subscription: WebhookSubscription = item.subscription;
          const payload: WebhookPayload = item.payload;

          const success = await this.deliver(subscription, payload);

          if (success) {
            // Remove from failed queue
            await cacheService.redis.lrem(this.FAILED_QUEUE_KEY, 1, itemData);
            retried++;
          } else {
            // Increment retry count
            item.retryCount++;
            await cacheService.redis.lset(
              this.FAILED_QUEUE_KEY,
              failedItems.indexOf(itemData),
              JSON.stringify(item)
            );
          }
        }
      }

      logger.info(`Retried ${retried} failed webhooks`);

      return retried;
    } catch (error) {
      logger.error('Failed to retry webhooks:', error);
      return 0;
    }
  }

  /**
   * Get all subscriptions
   */
  private static async getAllSubscriptions(): Promise<WebhookSubscription[]> {
    const subscriptions = await cacheService.get<WebhookSubscription[]>(this.WEBHOOK_KEY);
    return subscriptions || [];
  }

  /**
   * Generate HMAC signature for payload
   */
  private static generateSignature(payload: WebhookPayload, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(payload: any, signature: string, secret: string): boolean {
    const expected = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  /**
   * Queue failed webhook for retry
   */
  private static async queueForRetry(
    subscription: WebhookSubscription,
    payload: WebhookPayload
  ): Promise<void> {
    const item = {
      subscription,
      payload,
      retryCount: 0,
      queuedAt: new Date(),
    };

    await cacheService.redis.rpush(this.FAILED_QUEUE_KEY, JSON.stringify(item));
  }

  /**
   * Log webhook delivery
   */
  private static async logDelivery(
    subscriptionId: string,
    payload: WebhookPayload,
    success: boolean,
    statusCode?: number,
    error?: string
  ): Promise<void> {
    const log = {
      subscriptionId,
      event: payload.event,
      success,
      statusCode,
      error,
      timestamp: new Date(),
    };

    const logKey = `${this.DELIVERY_LOG_KEY}:${subscriptionId}`;

    // Keep last 100 deliveries per subscription
    await cacheService.redis.lpush(logKey, JSON.stringify(log));
    await cacheService.redis.ltrim(logKey, 0, 99);
  }

  /**
   * Get delivery logs for a subscription
   */
  static async getDeliveryLogs(subscriptionId: string, limit: number = 50): Promise<any[]> {
    const logKey = `${this.DELIVERY_LOG_KEY}:${subscriptionId}`;
    const logs = await cacheService.redis.lrange(logKey, 0, limit - 1);

    return logs.map((log) => JSON.parse(log));
  }
}
