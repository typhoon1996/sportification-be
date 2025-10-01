import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { IApiError } from '../types';
import logger from '../utils/logger';

// Middleware to handle validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map((error) => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
    }));

    logger.warn('Validation errors:', validationErrors);

    const apiError: IApiError = {
      message: 'Validation failed',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details: validationErrors,
    };

    res.status(400).json({
      success: false,
      message: apiError.message,
      errors: validationErrors.map((err) => err.message),
      details: validationErrors,
    });
    return;
  }

  next();
};

// Alias for common usage
export const validateRequest = handleValidationErrors;

// Wrapper to run validation chains
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    for (const validation of validations) {
      await validation.run(req);
    }

    // Handle validation errors
    handleValidationErrors(req, res, next);
  };
};

// Custom validation helper for MongoDB ObjectIds
export const isValidObjectId = (value: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(value);
};

// Custom validation for arrays
export const isValidArray = (value: any, minLength = 0, maxLength = 100): boolean => {
  return Array.isArray(value) && value.length >= minLength && value.length <= maxLength;
};

// Custom validation for email
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Custom validation for phone numbers
export const isValidPhoneNumber = (phone: string): boolean => {
  return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''));
};

// Custom validation for URLs
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Custom validation for passwords
export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, contains uppercase, lowercase, number
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(password);
};

// Sanitization helpers
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};

export const sanitizeHTML = (str: string): string => {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Pagination validation
export const validatePagination = (page?: string, limit?: string) => {
  const pageNum = parseInt(page || '1', 10);
  const limitNum = parseInt(limit || '10', 10);

  const validatedPage = Math.max(1, pageNum);
  const validatedLimit = Math.min(Math.max(1, limitNum), 100); // Max 100 items per page

  return {
    page: validatedPage,
    limit: validatedLimit,
    skip: (validatedPage - 1) * validatedLimit,
  };
};

// Sort validation
export const validateSort = (sort?: string): Record<string, 1 | -1> => {
  if (!sort) return { createdAt: -1 }; // Default sort

  const sortObj: Record<string, 1 | -1> = {};
  const sortFields = sort.split(',');

  for (const field of sortFields) {
    const trimmed = field.trim();
    if (trimmed.startsWith('-')) {
      const fieldName = trimmed.substring(1);
      sortObj[fieldName] = -1;
    } else {
      sortObj[trimmed] = 1;
    }
  }

  return sortObj;
};

// File validation
export const isValidFileType = (mimetype: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(mimetype);
};

export const isValidFileSize = (size: number, maxSize: number): boolean => {
  return size > 0 && size <= maxSize;
};

// Date validation
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const isFutureDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date > new Date();
};

export const isPastDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date < new Date();
};

// Common validation chains
export const paginationValidation: ValidationChain[] = [];

export const idParamValidation: ValidationChain[] = [];

// Export commonly used validation functions
export { validationResult, ValidationChain } from 'express-validator';
