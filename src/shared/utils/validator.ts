/**
 * Enhanced Validation Utilities
 *
 * Provides reusable validation functions for common data types
 */

import { ValidationError } from '../middleware/errorHandler';

export class Validator {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number (international format)
   */
  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate date range
   */
  static isValidDateRange(startDate: Date, endDate: Date): boolean {
    return startDate < endDate;
  }

  /**
   * Validate MongoDB ObjectId
   */
  static isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  /**
   * Validate password strength
   */
  static isStrongPassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize user input
   */
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate and sanitize object
   */
  static sanitizeObject<T extends Record<string, any>>(
    obj: T,
    allowedFields: string[]
  ): Partial<T> {
    const sanitized: Partial<T> = {};

    for (const field of allowedFields) {
      if (obj[field] !== undefined) {
        if (typeof obj[field] === 'string') {
          sanitized[field as keyof T] = this.sanitizeInput(obj[field]) as any;
        } else {
          sanitized[field as keyof T] = obj[field];
        }
      }
    }

    return sanitized;
  }

  /**
   * Validate required fields
   */
  static validateRequiredFields(data: Record<string, any>, requiredFields: string[]): void {
    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Validate numeric range
   */
  static isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * Validate array length
   */
  static isValidArrayLength(arr: any[], min: number, max: number): boolean {
    return arr.length >= min && arr.length <= max;
  }

  /**
   * Validate file size (in bytes)
   */
  static isValidFileSize(size: number, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return size <= maxSizeBytes;
  }

  /**
   * Validate file type
   */
  static isValidFileType(filename: string, allowedExtensions: string[]): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext ? allowedExtensions.includes(ext) : false;
  }
}
