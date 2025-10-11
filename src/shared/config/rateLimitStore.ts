import RedisStore from 'rate-limit-redis';
import config from './index';
import { createRedisClient, RedisClient } from './redis';
import logger from '../utils/logger';

let rateLimitClient: RedisClient | undefined;

/**
 * Creates a new RedisStore instance with a unique prefix for each rate limiter.
 * Each rate limiter must have its own store instance to avoid sharing violations.
 *
 * @param uniquePrefix - Unique identifier for this rate limiter (e.g., 'general', 'auth', 'api', 'upload')
 * @returns A new RedisStore instance or undefined if Redis is unavailable
 */
export const getRateLimitStore = (uniquePrefix: string = 'default'): RedisStore | undefined => {
  if (config.app.env === 'test') {
    return undefined;
  }

  try {
    // Ensure we have a Redis client (create once, reuse for all stores)
    rateLimitClient ??= createRedisClient({
      keyPrefix: 'sportification:rate-limit:',
      lazyConnect: false,
    });

    // Create a NEW store instance with a unique prefix for each limiter
    const store = new RedisStore({
      prefix: `sportification:rate-limit:${uniquePrefix}:`,
      sendCommand: (...args: string[]) => (rateLimitClient as any).call(...args),
    });

    return store;
  } catch (error) {
    logger.error(`Failed to initialize Redis rate limit store for ${uniquePrefix}:`, error);
    return undefined;
  }
};

export const closeRateLimitStore = async (): Promise<boolean> => {
  if (rateLimitClient) {
    try {
      await rateLimitClient.quit();
    } catch (error) {
      logger.warn('Error closing Redis rate limit client:', error);
    } finally {
      rateLimitClient = undefined;
    }

    return true;
  }

  return false;
};
