import {Request, Response, NextFunction} from "express";
import logger from "../infrastructure/logging";

// Enhanced request logging middleware
export const advancedRequestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const originalSend = res.send;
  const originalJson = res.json;

  // Capture request details
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.socket?.remoteAddress,
    userAgent: req.get("User-Agent"),
    contentType: req.get("Content-Type"),
    contentLength: req.get("Content-Length"),
    referer: req.get("Referer"),
    userId: (req as any).userId || "anonymous",
    timestamp: new Date().toISOString(),
    requestId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
  };

  // Store request ID for tracing
  (req as any).requestId = requestInfo.requestId;

  // Override response methods to capture response data
  res.send = function (body) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    logRequestResponse(requestInfo, {
      statusCode: res.statusCode,
      duration,
      responseSize: body ? Buffer.byteLength(body.toString()) : 0,
    });

    return originalSend.call(this, body);
  };

  res.json = function (obj) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    logRequestResponse(requestInfo, {
      statusCode: res.statusCode,
      duration,
      responseSize: obj ? JSON.stringify(obj).length : 0,
    });

    return originalJson.call(this, obj);
  };

  next();
};

function logRequestResponse(requestInfo: any, responseInfo: any) {
  const logData = {
    ...requestInfo,
    ...responseInfo,
    message: `${requestInfo.method} ${requestInfo.url} ${responseInfo.statusCode} ${responseInfo.duration}ms`,
  };

  // Log based on status code
  if (responseInfo.statusCode >= 500) {
    logger.error("Request failed", logData);
  } else if (responseInfo.statusCode >= 400) {
    logger.warn("Client error", logData);
  } else {
    logger.info("Request completed", logData);
  }

  // Log slow requests
  if (responseInfo.duration > 1000) {
    logger.warn("Slow request detected", {
      ...logData,
      slowRequest: true,
      performanceImpact: responseInfo.duration > 5000 ? "high" : "medium",
    });
  }
}

// Security logging middleware
export const securityLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /<script/i, // XSS
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript injection
    /vbscript:/i, // VBScript injection
    /onload=/i, // Event handler injection
    /onerror=/i, // Error handler injection
  ];

  const checkForSuspiciousContent = (content: string): boolean => {
    return suspiciousPatterns.some(pattern => pattern.test(content));
  };

  // Check URL for suspicious patterns
  if (checkForSuspiciousContent(req.originalUrl)) {
    logger.warn("Suspicious URL detected", {
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      method: req.method,
      timestamp: new Date().toISOString(),
      type: "suspicious_url",
    });
  }

  // Check request body for suspicious patterns
  if (req.body && typeof req.body === "object") {
    const bodyStr = JSON.stringify(req.body);
    if (checkForSuspiciousContent(bodyStr)) {
      logger.warn("Suspicious request body detected", {
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        method: req.method,
        bodyPreview: bodyStr.substring(0, 200),
        timestamp: new Date().toISOString(),
        type: "suspicious_body",
      });
    }
  }

  next();
};

// API usage analytics middleware
export const analyticsLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const originalEnd = res.end.bind(res);

  res.end = function (this: Response, chunk?: any, encoding?: any, cb?: any) {
    // Log API usage analytics
    logger.info("API Analytics", {
      endpoint: req.route?.path || req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      userId: (req as any).userId,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
      timestamp: new Date().toISOString(),
      success: res.statusCode < 400,
      category: categorizeEndpoint(req.originalUrl),
    });

    return originalEnd.call(this, chunk, encoding, cb);
  } as any;

  next();
};

function categorizeEndpoint(url: string): string {
  if (url.includes("/auth")) return "authentication";
  if (url.includes("/users")) return "user_management";
  if (url.includes("/matches")) return "match_management";
  if (url.includes("/tournaments")) return "tournament_management";
  if (url.includes("/notifications")) return "notifications";
  if (url.includes("/chats")) return "messaging";
  return "other";
}

// Error tracking middleware
export const errorTracker = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Enhanced error logging with context
  let severity: string;
  if (error.name === "ValidationError") {
    severity = "low";
  } else if (error.name === "UnauthorizedError") {
    severity = "medium";
  } else {
    severity = "high";
  }

  logger.error("Application Error", {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.method !== "GET" ? req.body : undefined,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      userId: (req as any).userId,
      requestId: (req as any).requestId,
    },
    timestamp: new Date().toISOString(),
    severity,
  });

  next(error);
};

export default {
  advancedRequestLogger,
  securityLogger,
  analyticsLogger,
  errorTracker,
};
