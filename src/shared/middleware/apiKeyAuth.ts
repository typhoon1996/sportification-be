import crypto from "crypto";
import {Request, Response, NextFunction} from "express";
import rateLimit from "express-rate-limit";
import {ApiKey} from "../../modules/iam/domain/models";
import logger from "../infrastructure/logging";
import {authenticate} from "./auth";

// Extend Express Request interface to include API key info
declare module "express" {
  interface Request {
    apiKey?: any;
    apiKeyPermissions?: string[];
  }
}

// Rate limiter storage for API keys
const apiKeyLimiters = new Map<string, any>();

/**
 * Middleware to authenticate API key
 */
export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract API key from header
    const apiKeyHeader = req.headers["x-api-key"] as string;

    if (!apiKeyHeader) {
      res.status(401).json({
        success: false,
        message: "API key is required",
        errors: ["X-API-Key header is missing"],
        code: "NO_API_KEY",
      });
      return;
    }

    // Hash the provided key to compare with stored hash
    const keyHash = crypto
      .createHash("sha256")
      .update(apiKeyHeader)
      .digest("hex");

    // Find API key in database
    const apiKey = await ApiKey.findByHash(keyHash);
    const populatedApiKey = apiKey
      ? await ApiKey.findById(apiKey._id).populate("userId")
      : null;

    if (!populatedApiKey) {
      logger.warn(`Invalid API key attempted`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        keyPrefix: apiKeyHeader.substring(0, 10) + "...",
      });

      res.status(401).json({
        success: false,
        message: "Invalid API key",
        errors: ["The provided API key is invalid"],
        code: "INVALID_API_KEY",
      });
      return;
    }

    // Check if API key is expired
    if (populatedApiKey.expiresAt && populatedApiKey.expiresAt < new Date()) {
      res.status(401).json({
        success: false,
        message: "API key has expired",
        errors: ["The API key has expired"],
        code: "API_KEY_EXPIRED",
      });
      return;
    }

    // Check IP restrictions
    if (
      populatedApiKey.allowedIPs.length > 0 &&
      !populatedApiKey.allowedIPs.includes(req.ip!)
    ) {
      logger.warn(`API key used from unauthorized IP`, {
        keyId: populatedApiKey._id,
        ip: req.ip,
        allowedIPs: populatedApiKey.allowedIPs,
      });

      res.status(403).json({
        success: false,
        message: "Access denied from this IP address",
        errors: ["Your IP address is not authorized to use this API key"],
        code: "IP_NOT_ALLOWED",
      });
      return;
    }

    // Apply rate limiting for this API key
    const keyId = String(populatedApiKey._id);
    if (!apiKeyLimiters.has(keyId)) {
      const limiter = rateLimit({
        windowMs: populatedApiKey.rateLimit.windowMs,
        max: populatedApiKey.rateLimit.maxRequests,
        message: {
          success: false,
          message: "Rate limit exceeded for this API key",
          errors: ["Too many requests from this API key"],
          code: "API_KEY_RATE_LIMIT",
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: () => keyId, // Use API key ID as the key
        handler: (req: Request, res: Response) => {
          logger.warn(`API key rate limit exceeded`, {
            keyId: populatedApiKey._id,
            ip: req.ip,
            url: req.url,
          });

          res.status(429).json({
            success: false,
            message: "Rate limit exceeded for this API key",
            errors: ["Too many requests from this API key"],
            code: "API_KEY_RATE_LIMIT",
          });
        },
      });

      apiKeyLimiters.set(keyId, limiter);
    }

    // Apply rate limiting
    const limiter = apiKeyLimiters.get(keyId);
    limiter(req, res, (err: any) => {
      if (err) {
        return next(err);
      }

      // Update last used timestamp (async, don't wait)
      populatedApiKey.updateLastUsed().catch((error: any) => {
        logger.error("Failed to update API key last used timestamp:", error);
      });

      // Attach API key info to request
      req.apiKey = populatedApiKey;
      req.apiKeyPermissions = populatedApiKey.permissions;
      req.user = populatedApiKey.userId; // Set user from API key
      req.userId = String(populatedApiKey.userId._id);

      logger.info(`API key authenticated`, {
        keyId: populatedApiKey._id,
        keyName: populatedApiKey.name,
        userId: populatedApiKey.userId._id,
        ip: req.ip,
      });

      next();
    });
  } catch (error: any) {
    logger.error("API key authentication error:", error);

    res.status(500).json({
      success: false,
      message: "Authentication failed",
      errors: ["Internal server error during API key authentication"],
      code: "AUTH_ERROR",
    });
  }
};

/**
 * Middleware to check API key permissions
 */
export const requireApiKeyPermission = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.apiKey) {
      res.status(401).json({
        success: false,
        message: "API key authentication required",
        errors: ["Request must be authenticated with a valid API key"],
        code: "API_KEY_REQUIRED",
      });
      return;
    }

    const userPermissions = req.apiKeyPermissions || [];

    // Check if user has admin permission (grants all access)
    if (userPermissions.includes("admin:all")) {
      return next();
    }

    // Check if user has at least one of the required permissions
    const hasPermission = requiredPermissions.some(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      logger.warn(`API key permission denied`, {
        keyId: req.apiKey._id,
        keyName: req.apiKey.name,
        userPermissions,
        requiredPermissions,
        url: req.url,
        method: req.method,
      });

      res.status(403).json({
        success: false,
        message: "Insufficient API key permissions",
        errors: [
          `This API key does not have the required permissions: ${requiredPermissions.join(", ")}`,
        ],
        code: "INSUFFICIENT_PERMISSIONS",
      });
      return;
    }

    next();
  };
};

/**
 * Combined authentication middleware that accepts either JWT token or API key
 */
export const authenticateApiKeyOrJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Check if API key is provided
  const apiKeyHeader = req.headers["x-api-key"];
  if (apiKeyHeader) {
    return authenticateApiKey(req, res, next);
  }

  // Check if JWT token is provided
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    // Use existing JWT authentication middleware
    return authenticate(req, res, next);
  }

  // No authentication provided
  res.status(401).json({
    success: false,
    message: "Authentication required",
    errors: ["Either JWT token or API key must be provided"],
    code: "NO_AUTH",
  });
};
