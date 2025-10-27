import {createRedisClient, RedisClient} from "../../config/redis";
import logger from "../logging";

/**
 * Redis Cache Service
 *
 * Provides caching functionality with automatic serialization/deserialization
 * and connection management with retry logic
 */

class CacheService {
  private readonly _redis: RedisClient;
  private isConnected: boolean = false;

  constructor() {
    this._redis = createRedisClient({
      lazyConnect: true,
      keyPrefix: "sportification:cache:",
    });

    this.setupEventHandlers();
  }

  /**
   * Get the redis client instance for direct operations
   */
  get redis(): RedisClient {
    return this._redis;
  }

  private setupEventHandlers(): void {
    this._redis.on("connect", () => {
      this.isConnected = true;
    });

    this._redis.on("ready", () => {
      this.isConnected = true;
    });

    this._redis.on("error", () => {
      this.isConnected = false;
    });

    this._redis.on("close", () => {
      this.isConnected = false;
    });

    this._redis.on("reconnecting", () => {
      this.isConnected = false;
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    try {
      await this._redis.connect();
      logger.info("🎉 Redis cache service initialized");
    } catch (error) {
      logger.error("💥 Failed to connect to Redis:", error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis and clean up resources
   */
  async disconnect(): Promise<void> {
    this._redis.disconnect();
    this.isConnected = false;
    logger.info("👋 Redis connection closed");
  }

  /**
   * Check if Redis connection is ready for operations
   *
   * @return True if connected and ready, false otherwise
   */
  isReady(): boolean {
    return this.isConnected && this._redis.status === "ready";
  }

  /**
   * Store a value in Redis cache with optional expiration
   * Automatically serializes objects to JSON
   *
   * @param key - Cache key (will be prefixed with 'sportification:cache:')
   * @param value - Value to cache (will be JSON serialized)
   * @param expirationSeconds - Optional expiration time in seconds
   * @throws {Error} If caching operation fails
   * @example
   * // Cache for 1 hour
   * await cache.set('user:123', userData, 3600);
   *
   * // Cache forever (until manually deleted)
   * await cache.set('config', configData);
   */
  async set<T>(
    key: string,
    value: T,
    expirationSeconds?: number
  ): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);

      if (expirationSeconds) {
        await this._redis.setex(key, expirationSeconds, serializedValue);
      } else {
        await this._redis.set(key, serializedValue);
      }

      logger.debug(`📝 Cached data for key: ${key}`);
    } catch (error) {
      logger.error(`❌ Failed to cache data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve a value from Redis cache
   * Automatically deserializes JSON to the expected type
   *
   * @param key - Cache key to retrieve (will be prefixed with 'sportification:cache:')
   * @return The cached value or null if not found
   * @example
   * const userData = await cache.get<User>('user:123');
   * if (userData) {
   *   // Use cached data
   * } else {
   *   // Fetch from database and cache
   * }
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cachedValue = await this._redis.get(key);

      if (cachedValue === null) {
        logger.debug(`🔍 Cache miss for key: ${key}`);
        return null;
      }

      logger.debug(`✅ Cache hit for key: ${key}`);
      return JSON.parse(cachedValue) as T;
    } catch (error) {
      logger.error(`❌ Failed to retrieve cached data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this._redis.del(key);
      logger.debug(`🗑️  Deleted cache key: ${key}`);
      return result === 1;
    } catch (error) {
      logger.error(`❌ Failed to delete cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this._redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`❌ Failed to check existence of key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this._redis.expire(key, seconds);
      return result === 1;
    } catch (error) {
      logger.error(`❌ Failed to set expiration for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get time to live for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this._redis.ttl(key);
    } catch (error) {
      logger.error(`❌ Failed to get TTL for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Increment a counter
   */
  async increment(key: string, by: number = 1): Promise<number> {
    try {
      const result = await this._redis.incrby(key, by);
      logger.debug(`📈 Incremented ${key} by ${by}, new value: ${result}`);
      return result;
    } catch (error) {
      logger.error(`❌ Failed to increment key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Cache with automatic refresh
   */
  async cacheWithRefresh<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    expirationSeconds: number = 3600
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cachedValue = await this.get<T>(key);

      if (cachedValue !== null) {
        return cachedValue;
      }

      // If not in cache, fetch fresh data
      logger.debug(`🔄 Fetching fresh data for key: ${key}`);
      const freshData = await fetchFunction();

      // Cache the fresh data
      await this.set(key, freshData, expirationSeconds);

      return freshData;
    } catch (error) {
      logger.error(`❌ Failed to cache with refresh for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Flush all cached data
   */
  async flushAll(): Promise<void> {
    try {
      await this._redis.flushall();
      logger.warn("🧹 Flushed all Redis cache");
    } catch (error) {
      logger.error("❌ Failed to flush Redis cache:", error);
      throw error;
    }
  }

  /**
   * Get Redis info
   */
  async getInfo(): Promise<string> {
    try {
      return await this._redis.info();
    } catch (error) {
      logger.error("❌ Failed to get Redis info:", error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this._redis.ping();
      return result === "PONG";
    } catch (error) {
      logger.error("❌ Redis health check failed:", error);
      return false;
    }
  }

  /**
   * Cache patterns for common use cases
   */

  // User session caching
  async cacheUserSession(
    userId: string,
    sessionData: Record<string, unknown>,
    expirationSeconds: number = 3600
  ): Promise<void> {
    await this.set(`user:session:${userId}`, sessionData, expirationSeconds);
  }

  async getUserSession(
    userId: string
  ): Promise<Record<string, unknown> | null> {
    return await this.get(`user:session:${userId}`);
  }

  async invalidateUserSession(userId: string): Promise<boolean> {
    return await this.delete(`user:session:${userId}`);
  }

  // API response caching
  async cacheApiResponse<T>(
    endpoint: string,
    params: Record<string, unknown>,
    response: T,
    expirationSeconds: number = 300
  ): Promise<void> {
    const cacheKey = `api:${endpoint}:${JSON.stringify(params)}`;
    await this.set(cacheKey, response, expirationSeconds);
  }

  async getCachedApiResponse<T>(
    endpoint: string,
    params: Record<string, unknown>
  ): Promise<T | null> {
    const cacheKey = `api:${endpoint}:${JSON.stringify(params)}`;
    return await this.get(cacheKey);
  }

  // Rate limiting
  async checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{allowed: boolean; remaining: number; resetTime: number}> {
    const key = `rate_limit:${identifier}`;
    const current = await this.increment(key);

    if (current === 1) {
      await this.expire(key, windowSeconds);
    }

    const ttl = await this.ttl(key);
    const resetTime = Date.now() + ttl * 1000;

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetTime,
    };
  }
}

// Create and export singleton instance
const cacheService = new CacheService();
export default cacheService;
