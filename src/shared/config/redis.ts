import Redis, {RedisOptions} from "ioredis";
import config from "./index";
import logger from "../infrastructure/logging";

const defaultOptions: RedisOptions = {
  maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
  enableReadyCheck: config.redis.enableReadyCheck,
  keepAlive: 30000,
  family: 4,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

const attachEventHandlers = (client: Redis): void => {
  client.on("connect", () => {
    logger.info("📡 Redis connected successfully");
  });

  client.on("ready", () => {
    logger.info("🚀 Redis is ready to receive commands");
  });

  client.on("error", (error: Error) => {
    logger.error("❌ Redis connection error:", error);
  });

  client.on("close", () => {
    logger.warn("⚠️  Redis connection closed");
  });

  client.on("reconnecting", (time: number) => {
    logger.info(`🔄 Redis reconnecting in ${time}ms`);
  });
};

export const createRedisClient = (
  overrides: Partial<RedisOptions> = {}
): Redis => {
  const client = new Redis(config.redis.url, {
    ...defaultOptions,
    ...overrides,
  });

  attachEventHandlers(client);

  return client;
};

export type RedisClient = Redis;
