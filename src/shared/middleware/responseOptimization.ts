/**
 * Response Compression and Optimization Middleware
 *
 * Optimizes API responses for better performance
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../infrastructure/logging';
import cacheService from '../infrastructure/cache';

/**
 * Response transformation middleware
 */
export const transformResponse = (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json;

  res.json = function (data: any) {
    // Add response timing
    const responseTime = Date.now() - (req as any).startTime;

    // Add metadata to response
    if (data && typeof data === 'object' && data.meta) {
      data.meta = {
        ...data.meta,
        responseTime: `${responseTime}ms`,
        requestId: (req as any).id,
      };
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Conditional response caching
 */
export const cacheResponse = (ttlSeconds: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from request
    const cacheKey = `response:${req.originalUrl || req.url}`;

    try {
      // Check cache
      const cachedResponse = await cacheService.get(cacheKey);

      if (cachedResponse) {
        logger.debug(`Serving cached response for ${cacheKey}`);
        return res.json(cachedResponse);
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache response
      res.json = function (data: any) {
        // Cache the response
        cacheService.set(cacheKey, data, ttlSeconds).catch((err) => {
          logger.error('Failed to cache response:', err);
        });

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Field filtering middleware
 * Allows clients to request specific fields only
 */
export const fieldFilter = (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json;

  res.json = function (data: any) {
    const fields = req.query.fields as string;

    if (fields && data && typeof data === 'object') {
      const fieldsArray = fields.split(',').map((f) => f.trim());

      if (data.data && Array.isArray(data.data)) {
        // Filter array data
        data.data = data.data.map((item: any) => filterObject(item, fieldsArray));
      } else if (data.data && typeof data.data === 'object') {
        // Filter single object
        data.data = filterObject(data.data, fieldsArray);
      }
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Helper to filter object fields
 */
const filterObject = (obj: any, fields: string[]): any => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const filtered: any = {};

  fields.forEach((field) => {
    if (obj.hasOwnProperty(field)) {
      filtered[field] = obj[field];
    }
  });

  return Object.keys(filtered).length > 0 ? filtered : obj;
};

/**
 * ETag middleware for client-side caching
 */
export const etag = (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json;

  res.json = function (data: any) {
    if (req.method === 'GET') {
      const etag = `"${Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 27)}"`;
      res.setHeader('ETag', etag);

      // Check if client has cached version
      const clientEtag = req.headers['if-none-match'];
      if (clientEtag === etag) {
        return res.status(304).end();
      }
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Response size limiter
 */
export const responseSizeLimit = (maxSizeKB: number = 5000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json;

    res.json = function (data: any) {
      const size = Buffer.byteLength(JSON.stringify(data));
      const sizeKB = size / 1024;

      if (sizeKB > maxSizeKB) {
        logger.warn(`Response size (${sizeKB.toFixed(2)}KB) exceeds limit (${maxSizeKB}KB)`);

        // Return minimal response
        return res.status(413).json({
          success: false,
          message: 'Response too large',
          meta: {
            size: `${sizeKB.toFixed(2)}KB`,
            limit: `${maxSizeKB}KB`,
            suggestion: 'Use pagination or field filtering',
          },
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
};
