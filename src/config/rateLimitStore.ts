import RedisStore from "rate-limit-redis";
import config from "./index";
import { createRedisClient, RedisClient } from "./redis";
import logger from "../utils/logger";

let rateLimitClient: RedisClient | undefined;
let rateLimitStore: RedisStore | undefined;

export const getRateLimitStore = (): RedisStore | undefined => {
  if (config.app.env === "test") {
    return undefined;
  }

  if (rateLimitStore) {
    return rateLimitStore;
  }

  try {
    rateLimitClient = createRedisClient({
      keyPrefix: "sportification:rate-limit:",
      lazyConnect: false,
    });

    rateLimitStore = new RedisStore({
      prefix: "sportification:rate-limit:",
      sendCommand: (...args: string[]) =>
        (rateLimitClient as any).call(...args),
    });
  } catch (error) {
    logger.error("Failed to initialize Redis rate limit store:", error);
    rateLimitStore = undefined;
  }

  return rateLimitStore;
};

export const closeRateLimitStore = async (): Promise<boolean> => {
  if (rateLimitClient) {
    try {
      await rateLimitClient.quit();
    } catch (error) {
      logger.warn("Error closing Redis rate limit client:", error);
    } finally {
      rateLimitClient = undefined;
      rateLimitStore = undefined;
    }

    return true;
  }

  return false;
};
