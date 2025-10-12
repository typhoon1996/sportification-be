import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { IApiError, IApiResponse } from '../types';
import config from '../config';
import logger from '../infrastructure/logging';

// Custom error class
export class ApiError extends Error implements IApiError {
  statusCode: number;
  code?: string;
  details?: unknown;

  constructor(message: string, statusCode = 500, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Not Found Error
export class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'RESOURCE_NOT_FOUND');
  }
}

// Validation Error
export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

// Authorization Error
export class AuthorizationError extends ApiError {
  constructor(message = 'Access denied') {
    super(message, 403, 'ACCESS_DENIED');
  }
}

// Forbidden Error (alias for AuthorizationError)
export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

// Authentication Error
export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTH_FAILED');
  }
}

// Conflict Error
export class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'RESOURCE_CONFLICT');
  }
}

// Bad Request Error
export class BadRequestError extends ApiError {
  constructor(message = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

// Rate Limit Error
export class RateLimitError extends ApiError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Convert Mongoose errors to API errors
const handleMongooseError = (error: MongooseError): ApiError => {
  if (error.name === 'ValidationError') {
    const validationError = error as MongooseError.ValidationError;
    const messages = Object.values(validationError.errors).map((err) => err.message);
    return new ValidationError('Validation failed', {
      fields: Object.keys(validationError.errors),
      messages,
    });
  }

  if (error.name === 'CastError') {
    const castError = error as MongooseError.CastError;
    return new ValidationError(`Invalid ${castError.path}: ${castError.value}`);
  }

  if (error.name === 'MongoServerError') {
    const mongoError = error as any;
    if (mongoError.code === 11000) {
      // Duplicate key error
      const field = Object.keys(mongoError.keyPattern || {})[0] || 'field';
      return new ConflictError(`${field} already exists`);
    }
  }

  return new ApiError(error.message, 500, 'DATABASE_ERROR');
};

// Global error handler middleware
export const errorHandler = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let apiError: ApiError;

  // Convert different error types to ApiError
  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof MongooseError) {
    apiError = handleMongooseError(error);
  } else if (error.name === 'JsonWebTokenError') {
    apiError = new AuthenticationError('Invalid token');
  } else if (error.name === 'TokenExpiredError') {
    apiError = new AuthenticationError('Token expired');
  } else if (error.name === 'MulterError') {
    const multerError = error as any;
    if (multerError.code === 'LIMIT_FILE_SIZE') {
      apiError = new ValidationError('File size too large');
    } else if (multerError.code === 'LIMIT_FILE_COUNT') {
      apiError = new ValidationError('Too many files');
    } else {
      apiError = new ValidationError('File upload error');
    }
  } else {
    // Generic server error
    apiError = new ApiError(
      config.app.env === 'production' ? 'Internal server error' : error.message,
      500,
      'INTERNAL_ERROR'
    );
  }

  // Log error
  logger.error('API Error:', {
    message: apiError.message,
    statusCode: apiError.statusCode,
    code: apiError.code,
    stack: apiError.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.userId,
    details: apiError.details,
  });

  // Send error response
  const response: IApiResponse = {
    success: false,
    message: apiError.message,
    errors: [apiError.message],
    meta: {
      timestamp: new Date(),
      version: '1.0.0',
    },
  };

  // Include additional details in development
  if (config.app.env === 'development') {
    (response.meta as any) = {
      ...response.meta,
      code: apiError.code,
      details: apiError.details,
      stack: apiError.stack,
    };
  }

  res.status(apiError.statusCode).json(response);
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Success response helper
export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message = 'Success',
  statusCode = 200,
  meta?: any
): void => {
  const response: IApiResponse<T> = {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date(),
      version: '1.0.0',
      ...meta,
    },
  };

  res.status(statusCode).json(response);
};

// Created response helper
export const sendCreated = <T>(
  res: Response,
  data?: T,
  message = 'Resource created successfully'
): void => {
  sendSuccess(res, data, message, 201);
};

// No content response helper
export const sendNoContent = (res: Response): void => {
  res.status(204).send();
};
