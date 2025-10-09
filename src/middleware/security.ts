import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import type {
  Options as RateLimitOptions,
  Store as RateLimitStore,
} from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import compression from "compression";
import cors from "cors";
import config from "../config";
import logger from "../utils/logger";
import { getRateLimitStore } from "../config/rateLimitStore";

let rateLimitFallbackLogged = false;

// Rate limiting configuration
export const createRateLimiter = (
  windowMs: number = config.rateLimit.windowMs,
  max: number = config.rateLimit.maxRequests,
  message = "Too many requests from this IP"
) => {
  const redisStore = getRateLimitStore();

  const rateLimitOptions = {
    windowMs,
    max,
    message: {
      success: false,
      message,
      errors: [message],
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        url: req.url,
        method: req.method,
      });

      res.status(429).json({
        success: false,
        message,
        errors: [message],
        meta: {
          retryAfter: windowMs / 1000,
          timestamp: new Date(),
        },
      });
    },
  } as unknown as RateLimitOptions;

  if (redisStore) {
    rateLimitOptions.store = redisStore as unknown as RateLimitStore;
  }

  const limiter = rateLimit(rateLimitOptions);

  if (!redisStore && config.app.env !== "test" && !rateLimitFallbackLogged) {
    logger.warn(
      "Redis rate limit store unavailable; falling back to in-memory rate limiting"
    );
    rateLimitFallbackLogged = true;
  }

  return limiter;
};

// General rate limiter
export const generalLimiter = createRateLimiter();

// Strict rate limiter for auth endpoints
export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  "Too many authentication attempts, please try again later"
);

// Moderate rate limiter for API endpoints
export const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  50, // limit each IP to 50 requests per windowMs
  "Too many API requests, please try again later"
);

// Upload rate limiter
export const uploadLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // limit each IP to 10 file uploads per windowMs
  "Too many file uploads, please try again later"
);

// CORS configuration
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = Array.isArray(config.cors.origin)
      ? config.cors.origin
      : [config.cors.origin];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (config.app.env === "development") {
      // Allow any origin in development
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Check for wildcard patterns
    const isAllowed = allowedOrigins.some((allowedOrigin) => {
      if (allowedOrigin === "*") return true;
      if (allowedOrigin.includes("*")) {
        const pattern = allowedOrigin.replace(/\*/g, ".*");
        return new RegExp(`^${pattern}$`).test(origin);
      }
      return false;
    });

    if (isAllowed) {
      return callback(null, true);
    }

    const msg = `CORS policy violation: Origin ${origin} is not allowed`;
    logger.warn(msg);
    callback(new Error(msg), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Authorization",
    "Accept",
    "X-API-Key",
  ],
  exposedHeaders: ["X-Total-Count", "X-Page-Count"],
  maxAge: 86400, // 24 hours
};

// Helmet security configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

// Request sanitization middleware
export const sanitizeRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Sanitize request body
  mongoSanitize()(req, res, () => {
    // Additional sanitization can be added here
    next();
  });
};

// HTTP Parameter Pollution protection
export const preventParameterPollution = hpp({
  whitelist: ["sort", "fields", "populate"], // Allow arrays for these parameters
});

// Compression middleware
export const compressionMiddleware = compression({
  level: 6,
  threshold: 1024, // Only compress if size > 1KB
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) {
      return false;
    }
    return compression.filter(req, res);
  },
});

// Security headers middleware
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Remove sensitive headers
  res.removeHeader("X-Powered-By");

  // Add custom security headers
  res.setHeader("X-API-Version", "1.0.0");
  if ((req as any).startTime) {
    res.setHeader("X-Response-Time", Date.now() - (req as any).startTime);
  }

  next();
};

// Request logging middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  (req as any).startTime = Date.now();

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds

    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      userId: req.userId,
      contentLength: res.get("Content-Length"),
    };

    if (res.statusCode >= 400) {
      logger.warn("HTTP Request", logData);
    } else {
      logger.info("HTTP Request", logData);
    }
  });

  next();
};

// File type validation middleware
export const validateFileType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.file && !req.files) {
      return next();
    }

    const files: Express.Multer.File[] = (() => {
      if (!req.files) {
        return req.file ? [req.file] : [];
      }

      if (Array.isArray(req.files)) {
        return req.files;
      }

      const aggregated: Express.Multer.File[] = [];
      Object.values(req.files).forEach((fileGroup) => {
        if (Array.isArray(fileGroup)) {
          aggregated.push(...fileGroup);
        }
      });

      return aggregated;
    })();

    for (const file of files) {
      if (file && !allowedTypes.includes(file.mimetype)) {
        res.status(400).json({
          success: false,
          message: "Invalid file type",
          errors: [`File type ${file.mimetype} is not allowed`],
          allowedTypes,
        });
        return;
      }
    }

    next();
  };
};

// IP whitelist middleware (for admin endpoints)
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const forwardedFor = req.headers["x-forwarded-for"];
    let forwardedIP: string | undefined;

    if (Array.isArray(forwardedFor)) {
      forwardedIP = forwardedFor[0];
    } else if (typeof forwardedFor === "string") {
      forwardedIP = forwardedFor.split(",")[0]?.trim();
    }

    const clientIP = req.ip || forwardedIP || req.socket.remoteAddress || null;

    if (config.app.env === "development") {
      return next();
    }

    if (!allowedIPs.includes(clientIP || "")) {
      logger.warn(`IP ${clientIP} not in whitelist`, {
        ip: clientIP,
        url: req.url,
        method: req.method,
      });

      res.status(403).json({
        success: false,
        message: "Access denied",
        errors: ["Your IP address is not authorized"],
      });
      return;
    }

    next();
  };
};

// Content-Type validation
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentType = req.get("Content-Type");

    if (req.method === "GET" || req.method === "DELETE") {
      return next();
    }

    if (
      !contentType ||
      !allowedTypes.some((type) => contentType.includes(type))
    ) {
      res.status(415).json({
        success: false,
        message: "Unsupported Media Type",
        errors: [`Content-Type must be one of: ${allowedTypes.join(", ")}`],
      });
      return;
    }

    next();
  };
};
