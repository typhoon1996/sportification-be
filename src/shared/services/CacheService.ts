/**
 * CacheService - Redis Caching Service
 *
 * Provides centralized caching functionality for the IAM module:
 * - MFA status caching
 * - OAuth provider configuration caching
 * - Token verification result caching
 *
 * Uses Redis for distributed caching with TTL support.
 *
 * @class CacheService
 */

import Redis from "ioredis";
import config from "../../../config";
import logger from "../../infrastructure/logging";

export class CacheService {
  private static instance: CacheService;
  private redis: Redis;
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly KEY_PREFIX = "sportification:";

  private constructor() {
    this.redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
      enableReadyCheck: config.redis.enableReadyCheck,
      lazyConnect: true,
    });

    this.redis.on("error", (err) => {
      logger.error("Redis connection error:", err);
    });

    this.redis.on("connect", () => {
      logger.info("Redis connected successfully");
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    try {
      await this.redis.connect();
    } catch (error) {
      logger.error("Failed to connect to Redis:", error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
  }

  /**
   * Build prefixed cache key
   */
  private buildKey(key: string): string {
    return `${this.KEY_PREFIX}${key}`;
  }

  /**
   * Get value from cache
   *
   * @param key - Cache key
   * @returns Cached value or null
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(this.buildKey(key));
      if (!data) {
        return null;
      }
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error("Cache get error:", {key, error});
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (default: 5 minutes)
   */
  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const data = JSON.stringify(value);
      await this.redis.setex(this.buildKey(key), ttl, data);
    } catch (error) {
      logger.error("Cache set error:", {key, error});
    }
  }

  /**
   * Delete value from cache
   *
   * @param key - Cache key
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(this.buildKey(key));
    } catch (error) {
      logger.error("Cache delete error:", {key, error});
    }
  }

  /**
   * Delete multiple keys matching pattern
   *
   * @param pattern - Key pattern (e.g., 'mfa:*')
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(this.buildKey(pattern));
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error("Cache delete pattern error:", {pattern, error});
    }
  }

  /**
   * Check if key exists
   *
   * @param key - Cache key
   * @returns True if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(this.buildKey(key));
      return result === 1;
    } catch (error) {
      logger.error("Cache exists error:", {key, error});
      return false;
    }
  }

  /**
   * Cache MFA status for user
   *
   * @param userId - User ID
   * @param status - MFA status
   */
  async cacheMfaStatus(
    userId: string,
    status: {isEnabled: boolean; backupCodesCount: number}
  ): Promise<void> {
    const key = `mfa:status:${userId}`;
    await this.set(key, status, 600); // 10 minutes
  }

  /**
   * Get cached MFA status
   *
   * @param userId - User ID
   * @returns MFA status or null
   */
  async getMfaStatus(
    userId: string
  ): Promise<{isEnabled: boolean; backupCodesCount: number} | null> {
    const key = `mfa:status:${userId}`;
    return await this.get(key);
  }

  /**
   * Invalidate MFA status cache for user
   *
   * @param userId - User ID
   */
  async invalidateMfaStatus(userId: string): Promise<void> {
    const key = `mfa:status:${userId}`;
    await this.del(key);
  }

  /**
   * Cache OAuth provider configuration
   *
   * @param provider - Provider name
   * @param config - Provider configuration
   */
  async cacheOAuthConfig(provider: string, config: any): Promise<void> {
    const key = `oauth:config:${provider}`;
    await this.set(key, config, 3600); // 1 hour
  }

  /**
   * Get cached OAuth provider configuration
   *
   * @param provider - Provider name
   * @returns Provider config or null
   */
  async getOAuthConfig(provider: string): Promise<any> {
    const key = `oauth:config:${provider}`;
    return await this.get(key);
  }

  /**
   * Cache token verification result
   *
   * @param token - Token hash
   * @param result - Verification result
   */
  async cacheTokenVerification(token: string, result: any): Promise<void> {
    const key = `token:verify:${token}`;
    await this.set(key, result, 60); // 1 minute
  }

  /**
   * Get cached token verification result
   *
   * @param token - Token hash
   * @returns Verification result or null
   */
  async getTokenVerification(token: string): Promise<any> {
    const key = `token:verify:${token}`;
    return await this.get(key);
  }

  /**
   * Invalidate token verification cache
   *
   * @param token - Token hash
   */
  async invalidateTokenVerification(token: string): Promise<void> {
    const key = `token:verify:${token}`;
    await this.del(key);
  }

  /**
   * Increment counter with expiry
   *
   * @param key - Counter key
   * @param ttl - Time to live in seconds
   * @returns Current count
   */
  async incr(key: string, ttl: number = this.DEFAULT_TTL): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      const count = await this.redis.incr(fullKey);
      if (count === 1) {
        await this.redis.expire(fullKey, ttl);
      }
      return count;
    } catch (error) {
      logger.error("Cache incr error:", {key, error});
      return 0;
    }
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<{connected: boolean; ping?: string}> {
    try {
      const ping = await this.redis.ping();
      return {connected: true, ping};
    } catch (error) {
      return {connected: false};
    }
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();
