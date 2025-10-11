/**
 * Booking validation rules using express-validator
 */

import { body, query, param } from 'express-validator';

export const createBookingValidation = [
  body('venueId')
    .notEmpty()
    .withMessage('Venue ID is required')
    .isMongoId()
    .withMessage('Invalid venue ID'),

  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),

  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date'),

  body('bookingType')
    .notEmpty()
    .withMessage('Booking type is required')
    .isIn(['hourly', 'daily', 'recurring'])
    .withMessage('Invalid booking type'),

  body('participants')
    .notEmpty()
    .withMessage('Number of participants is required')
    .isInt({ min: 1 })
    .withMessage('Participants must be at least 1'),

  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),

  body('promoCodes').optional().isArray().withMessage('Promo codes must be an array'),

  body('promoCodes.*')
    .optional()
    .isString()
    .withMessage('Each promo code must be a string')
    .trim()
    .toUpperCase(),
];

export const updateBookingValidation = [
  param('id').isMongoId().withMessage('Invalid booking ID'),

  body('startTime').optional().isISO8601().withMessage('Start time must be a valid ISO 8601 date'),

  body('endTime').optional().isISO8601().withMessage('End time must be a valid ISO 8601 date'),

  body('participants').optional().isInt({ min: 1 }).withMessage('Participants must be at least 1'),

  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

export const cancelBookingValidation = [
  param('id').isMongoId().withMessage('Invalid booking ID'),

  body('reason')
    .notEmpty()
    .withMessage('Cancellation reason is required')
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
];

export const checkAvailabilityValidation = [
  body('venueId')
    .notEmpty()
    .withMessage('Venue ID is required')
    .isMongoId()
    .withMessage('Invalid venue ID'),

  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),

  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date'),
];

export const confirmPaymentValidation = [
  param('id').isMongoId().withMessage('Invalid booking ID'),

  body('transactionId')
    .notEmpty()
    .withMessage('Transaction ID is required')
    .isString()
    .withMessage('Transaction ID must be a string'),

  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isString()
    .withMessage('Payment method must be a string'),
];

export const bookingIdValidation = [param('id').isMongoId().withMessage('Invalid booking ID')];

export const venueIdValidation = [param('venueId').isMongoId().withMessage('Invalid venue ID')];

export const getBookingsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('venueId').optional().isMongoId().withMessage('Invalid venue ID'),

  query('userId').optional().isMongoId().withMessage('Invalid user ID'),

  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'])
    .withMessage('Invalid booking status'),

  query('paymentStatus')
    .optional()
    .isIn(['pending', 'paid', 'refunded', 'partially_refunded'])
    .withMessage('Invalid payment status'),

  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date'),
];

export const getVenueCalendarValidation = [
  param('venueId').isMongoId().withMessage('Invalid venue ID'),

  query('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
];

export const getVenueAnalyticsValidation = [
  param('venueId').isMongoId().withMessage('Invalid venue ID'),

  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date'),
];
