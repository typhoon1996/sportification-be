import {Request, Response, NextFunction} from "express";
import {AnalyticsService} from "../services/analytics";
import logger from "../infrastructure/logging";
import crypto from "crypto";

declare global {
  namespace Express {
    interface Request {
      startTime?: [number, number] | number; // Support both hrtime and timestamp
      dbQueries?: {
        count: number;
        totalTime: number;
        slowQueries: Array<{query: string; time: number}>;
      };
      cacheHits?: number;
      cacheMisses?: number;
      correlationId?: string;
      userId?: string;
    }
  }
}

const SLOW_REQUEST_THRESHOLD_MS = 1000;
const VERY_SLOW_REQUEST_THRESHOLD_MS = 2000;
const SLOW_QUERY_THRESHOLD_MS = 100;
const MEMORY_ALERT_MB = 500;
const APM_INTERVAL_MS = 5 * 60 * 1000;

export const performanceMonitoring = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  req.startTime = process.hrtime();
  req.dbQueries = {count: 0, totalTime: 0, slowQueries: []};
  req.cacheHits = 0;
  req.cacheMisses = 0;

  const onFinish = () => {
    captureMetrics(req, res);
    performanceAlerts.checkResponseTime(res.locals.responseTime ?? 0, req.path);
  };

  const onClose = () => {
    res.removeListener("finish", onFinish);
    res.removeListener("close", onClose);
  };

  res.once("finish", onFinish);
  res.once("close", onClose);

  next();
};

function captureMetrics(req: Request, res: Response): void {
  if (!req.startTime) return;

  // Handle both hrtime format and timestamp (for backwards compatibility)
  let responseTime: number;
  if (Array.isArray(req.startTime)) {
    const [sec, nano] = process.hrtime(req.startTime);
    responseTime = sec * 1000 + nano / 1e6;
  } else if (typeof req.startTime === "number") {
    // Fallback for old timestamp format
    responseTime = Date.now() - req.startTime;
  } else {
    return;
  }

  res.locals.responseTime = responseTime;

  const requestSize = getRequestSize(req);
  const responseSize = Number(res.get("Content-Length")) || 0;

  setImmediate(() => {
    void AnalyticsService.trackPerformance({
      endpoint: req.route?.path || req.originalUrl || req.path,
      method: req.method,
      responseTime,
      statusCode: res.statusCode,
      requestSize,
      responseSize,
      userId: req.userId,
      errors: res.statusCode >= 400 ? [`HTTP ${res.statusCode}`] : undefined,
      dbQueries: req.dbQueries,
      cacheHits: req.cacheHits,
      cacheMisses: req.cacheMisses,
      correlationId: req.correlationId,
    });
  });

  if (responseTime > VERY_SLOW_REQUEST_THRESHOLD_MS) {
    logger.error("Very slow request", buildLogMeta(req, res, {responseTime}));
  } else if (responseTime > SLOW_REQUEST_THRESHOLD_MS) {
    logger.warn("Slow request", buildLogMeta(req, res, {responseTime}));
  }

  if (res.statusCode >= 400) {
    const logMethod = res.statusCode >= 500 ? logger.error : logger.warn;
    logMethod("Request error", buildLogMeta(req, res, {responseTime}));
  }
}

function buildLogMeta(
  req: Request,
  res: Response,
  extra: Record<string, unknown> = {}
) {
  return {
    endpoint: req.originalUrl || req.path,
    method: req.method,
    statusCode: res.statusCode,
    userId: req.userId,
    correlationId: req.correlationId,
    ...extra,
  };
}

function getRequestSize(req: Request): number {
  const contentLength = req.get("content-length");
  if (contentLength) {
    const parsed = parseInt(contentLength, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (req.body && typeof req.body === "object") {
    try {
      return Buffer.byteLength(JSON.stringify(req.body), "utf8");
    } catch {
      return 0;
    }
  }

  return 0;
}

export const trackDatabaseQueries = {
  beforeQuery: (_req: Request, query: string) => ({
    start: process.hrtime(),
    query,
  }),
  afterQuery: (
    req: Request,
    {start, query}: {start: [number, number]; query: string}
  ) => {
    const [sec, nano] = process.hrtime(start);
    const queryTime = sec * 1000 + nano / 1e6;

    if (!req.dbQueries) return;

    req.dbQueries.count += 1;
    req.dbQueries.totalTime += queryTime;

    if (queryTime > SLOW_QUERY_THRESHOLD_MS) {
      req.dbQueries.slowQueries.push({
        query: query.slice(0, 200),
        time: queryTime,
      });
    }
  },
};

export const trackCacheUsage = {
  hit: (req: Request) => {
    if (typeof req.cacheHits === "number") req.cacheHits += 1;
  },
  miss: (req: Request) => {
    if (typeof req.cacheMisses === "number") req.cacheMisses += 1;
  },
};

export const performanceAlerts = {
  checkResponseTime: (responseTime: number, endpoint: string) => {
    if (responseTime > VERY_SLOW_REQUEST_THRESHOLD_MS) {
      logger.warn("Performance alert: high response time", {
        endpoint,
        responseTime,
        alertType: "high_response_time",
        severity: "warning",
      });
    }
  },
  checkErrorRate: (
    endpoint: string,
    errorCount: number,
    totalCount: number
  ) => {
    const errorRate = totalCount ? errorCount / totalCount : 0;
    if (errorRate > 0.05) {
      logger.error("Performance alert: high error rate", {
        endpoint,
        errorRate,
        errorCount,
        totalCount,
        alertType: "high_error_rate",
        severity: "error",
      });
    }
  },
  checkMemoryUsage: () => {
    const {heapUsed, heapTotal, rss} = process.memoryUsage();
    const heapUsedMB = heapUsed / 1024 / 1024;

    if (heapUsedMB > MEMORY_ALERT_MB) {
      logger.warn("Performance alert: high memory usage", {
        heapUsedMB,
        heapTotalMB: heapTotal / 1024 / 1024,
        rssMB: rss / 1024 / 1024,
        alertType: "high_memory_usage",
        severity: "warning",
      });
    }
  },
};

let apmInterval: NodeJS.Timer | undefined;

export const setupAPM = () => {
  if (apmInterval) return;

  apmInterval = setInterval(async () => {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      await AnalyticsService.trackSystemHealth({
        component: "api",
        status: "healthy",
        responseTime: 0,
        errorRate: 0,
        throughput: 0,
        details: {
          memory: memUsage,
          cpu: cpuUsage,
          uptime: process.uptime(),
        },
      });

      performanceAlerts.checkMemoryUsage();
    } catch (error) {
      logger.error("Failed to capture system health metrics", {error});
    }
  }, APM_INTERVAL_MS);

  if (apmInterval.unref) apmInterval.unref();

  logger.info("APM initialized");
};

export const requestCorrelation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const correlationId =
    (req.headers["x-correlation-id"] as string) ||
    (req.headers["x-request-id"] as string) ||
    generateCorrelationId();

  req.correlationId = correlationId;
  res.setHeader("X-Correlation-ID", correlationId);

  res.locals.logMeta = {correlationId};
  next();
};

function generateCorrelationId(): string {
  return crypto.randomUUID();
}
