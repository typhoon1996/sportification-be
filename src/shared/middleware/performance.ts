import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../utils/analytics';
import logger from '../utils/logger';

// Extend Request interface for performance tracking
declare global {
  namespace Express {
    interface Request {
      startTime?: [number, number];
      dbQueries?: {
        count: number;
        totalTime: number;
        slowQueries: Array<{ query: string; time: number }>;
      };
      cacheHits?: number;
      cacheMisses?: number;
    }
  }
}

/**
 * Performance monitoring middleware
 */
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction): void => {
  // Start timing the request
  req.startTime = process.hrtime();
  req.dbQueries = { count: 0, totalTime: 0, slowQueries: [] };
  req.cacheHits = 0;
  req.cacheMisses = 0;

  // Hook into response to capture metrics
  const originalSend = res.send;
  const originalJson = res.json;

  res.send = function (body: any) {
    captureMetrics(req, res, body);
    return originalSend.call(this, body);
  };

  res.json = function (body: any) {
    captureMetrics(req, res, body);
    return originalJson.call(this, body);
  };

  next();
};

/**
 * Capture and store performance metrics
 */
function captureMetrics(req: Request, res: Response, responseBody: any): void {
  try {
    if (!req.startTime) return;

    const [seconds, nanoseconds] = process.hrtime(req.startTime);
    const responseTime = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds

    const requestSize = getRequestSize(req);
    const responseSize = getContentLength(responseBody);

    // Track performance metrics asynchronously
    setImmediate(() => {
      AnalyticsService.trackPerformance({
        endpoint: req.route?.path || req.path,
        method: req.method,
        responseTime,
        statusCode: res.statusCode,
        requestSize,
        responseSize,
        userId: (req as any).userId,
        errors: res.statusCode >= 400 ? [`HTTP ${res.statusCode}`] : undefined,
        dbQueries: req.dbQueries,
        cacheHits: req.cacheHits,
        cacheMisses: req.cacheMisses,
      });
    });

    // Log slow requests
    if (responseTime > 1000) {
      // Log requests slower than 1 second
      logger.warn(`Slow request detected: ${req.method} ${req.path} - ${responseTime}ms`, {
        endpoint: req.path,
        method: req.method,
        responseTime,
        statusCode: res.statusCode,
        userId: (req as any).userId,
      });
    }

    // Log errors
    if (res.statusCode >= 400) {
      logger.error(`Request error: ${req.method} ${req.path} - ${res.statusCode}`, {
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime,
        userId: (req as any).userId,
      });
    }
  } catch (error) {
    logger.error('Failed to capture performance metrics:', error);
  }
}

/**
 * Get request size in bytes
 */
function getRequestSize(req: Request): number {
  const contentLength = req.get('content-length');
  if (contentLength) {
    return parseInt(contentLength, 10);
  }

  // Estimate size based on body
  if (req.body) {
    return Buffer.byteLength(JSON.stringify(req.body), 'utf8');
  }

  return 0;
}

/**
 * Get response size in bytes
 */
function getContentLength(body: any): number {
  if (!body) return 0;

  if (typeof body === 'string') {
    return Buffer.byteLength(body, 'utf8');
  }

  if (typeof body === 'object') {
    return Buffer.byteLength(JSON.stringify(body), 'utf8');
  }

  return 0;
}

/**
 * Database query tracking middleware
 */
export const trackDatabaseQueries = {
  beforeQuery: (req: Request, query: string) => {
    const start = process.hrtime();
    return { start, query };
  },

  afterQuery: (req: Request, queryInfo: { start: [number, number]; query: string }) => {
    const [seconds, nanoseconds] = process.hrtime(queryInfo.start);
    const queryTime = seconds * 1000 + nanoseconds / 1000000;

    if (req.dbQueries) {
      req.dbQueries.count++;
      req.dbQueries.totalTime += queryTime;

      // Track slow queries (> 100ms)
      if (queryTime > 100) {
        req.dbQueries.slowQueries.push({
          query: queryInfo.query.substring(0, 200), // Truncate long queries
          time: queryTime,
        });
      }
    }
  },
};

/**
 * Cache tracking utilities
 */
export const trackCacheUsage = {
  hit: (req: Request) => {
    if (req.cacheHits !== undefined) {
      req.cacheHits++;
    }
  },

  miss: (req: Request) => {
    if (req.cacheMisses !== undefined) {
      req.cacheMisses++;
    }
  },
};

/**
 * Real-time performance alerts
 */
export const performanceAlerts = {
  checkResponseTime: (responseTime: number, endpoint: string) => {
    if (responseTime > 2000) {
      // Alert for requests > 2 seconds
      logger.warn(`Performance Alert: High response time`, {
        endpoint,
        responseTime,
        alertType: 'high_response_time',
        severity: 'warning',
      });
    }
  },

  checkErrorRate: (endpoint: string, errorCount: number, totalCount: number) => {
    const errorRate = errorCount / totalCount;
    if (errorRate > 0.05) {
      // Alert if error rate > 5%
      logger.error(`Performance Alert: High error rate`, {
        endpoint,
        errorRate,
        errorCount,
        totalCount,
        alertType: 'high_error_rate',
        severity: 'error',
      });
    }
  },

  checkMemoryUsage: () => {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;

    if (heapUsedMB > 500) {
      // Alert if heap usage > 500MB
      logger.warn(`Performance Alert: High memory usage`, {
        heapUsedMB,
        heapTotalMB: memUsage.heapTotal / 1024 / 1024,
        alertType: 'high_memory_usage',
        severity: 'warning',
      });
    }
  },
};

/**
 * Application Performance Monitoring (APM) setup
 */
export const setupAPM = () => {
  // Check system health every 5 minutes
  setInterval(async () => {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      await AnalyticsService.trackSystemHealth({
        component: 'api',
        status: 'healthy',
        responseTime: 0, // This would be the average response time
        errorRate: 0, // This would be calculated from recent errors
        throughput: 0, // This would be requests per second
        details: {
          memory: {
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external,
            rss: memUsage.rss,
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system,
          },
          uptime: process.uptime(),
        },
      });

      // Check for alerts
      performanceAlerts.checkMemoryUsage();
    } catch (error) {
      logger.error('Failed to capture system health metrics:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes

  logger.info('Application Performance Monitoring (APM) initialized');
};

/**
 * Request correlation middleware for distributed tracing
 */
export const requestCorrelation = (req: Request, res: Response, next: NextFunction): void => {
  // Generate or extract correlation ID
  const correlationId =
    (req.headers['x-correlation-id'] as string) ||
    (req.headers['x-request-id'] as string) ||
    generateCorrelationId();

  // Add correlation ID to request and response
  (req as any).correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  // Add to logger context
  logger.defaultMeta = { ...logger.defaultMeta, correlationId };

  next();
};

/**
 * Generate unique correlation ID
 */
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
