/**
 * Booking Controller - Venue Booking Management
 * 
 * Handles venue reservation and booking management for sports facilities.
 * Provides complete booking lifecycle management from creation through check-in/out,
 * including payment processing, availability checking, and cancellations.
 * 
 * Key Features:
 * - Booking creation with conflict detection
 * - Real-time availability checking
 * - Payment integration and confirmation
 * - Check-in/out tracking
 * - Cancellation with refund logic
 * - No-show tracking (venue owner feature)
 * - Multi-filter booking search
 * 
 * Booking Statuses:
 * - pending: Awaiting payment confirmation
 * - confirmed: Payment received, booking active
 * - checked_in: User has arrived at venue
 * - completed: Booking time finished, user checked out
 * - cancelled: Booking cancelled by user
 * - no_show: User failed to show up
 * 
 * Payment Integration:
 * - Supports multiple payment methods
 * - Transaction ID tracking
 * - Payment confirmation workflow
 * 
 * @class BookingController
 */

import { Request, Response } from 'express';
import { BookingService } from '../../domain/services/BookingService';
import { sendSuccess, sendCreated, asyncHandler } from '../../../../shared/middleware/errorHandler';
import { AuthRequest } from '../../../../shared/middleware/auth';
import { validatePagination } from '../../../../shared/middleware/validation';
import logger from '../../../../shared/infrastructure/logging';
import {
  CreateBookingDTO,
  UpdateBookingDTO,
  CancelBookingDTO,
  BookingStatus,
  BookingFilterOptions,
} from '../../types';

export class BookingController {
  private readonly bookingService: BookingService;

  constructor() {
    this.bookingService = new BookingService();
  }

  private getUserId(req: AuthRequest): string {
    if (!req.userId) {
      throw new Error('User not authenticated');
    }
    return req.userId;
  }

  /**
   * Create a new venue booking
   * 
   * Creates a new booking reservation for a venue with automatic conflict detection.
   * Checks venue availability and validates booking time slots. Sets initial status
   * to 'pending' until payment is confirmed.
   * 
   * Process:
   * 1. Validates booking time slot
   * 2. Checks venue availability (no conflicts)
   * 3. Creates booking with pending status
   * 4. Returns booking details for payment
   * 
   * @async
   * @param {AuthRequest} req - Express request with user authentication
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 201 Created with booking details
   * 
   * @throws {ValidationError} If time slot is invalid or in the past
   * @throws {ConflictError} If venue already booked for that time
   * @throws {NotFoundError} If venue doesn't exist
   * 
   * Request Body:
   * @property {string} venueId - ID of the venue to book
   * @property {Date} startTime - Booking start date/time
   * @property {Date} endTime - Booking end date/time
   * @property {number} participants - Number of participants (optional)
   * @property {string} purpose - Purpose of booking (optional)
   * 
   * @example
   * POST /api/v1/venues/bookings
   * Body: {
   *   venueId: "venue123",
   *   startTime: "2025-10-20T14:00:00Z",
   *   endTime: "2025-10-20T16:00:00Z",
   *   participants: 10,
   *   purpose: "Basketball practice"
   * }
   */
  createBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const dto: CreateBookingDTO = req.body;

    const booking = await this.bookingService.createBooking(userId, dto);

    logger.info('Booking created', { bookingId: booking.id, userId });

    sendCreated(res, { booking }, 'Booking created successfully');
  });

  /**
   * Get bookings with advanced filters
   * 
   * Retrieves a paginated list of bookings with comprehensive filtering options.
   * Supports filtering by venue, user, status, payment status, and date range.
   * Useful for venue owners to manage bookings and users to track their reservations.
   * 
   * @async
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with paginated booking list
   * 
   * Query Parameters:
   * @property {string} venueId - Filter by specific venue
   * @property {string} userId - Filter by specific user
   * @property {string} status - Filter by booking status (pending, confirmed, completed, cancelled, no_show)
   * @property {string} paymentStatus - Filter by payment status (pending, completed, refunded)
   * @property {string} startDate - Filter bookings after this date
   * @property {string} endDate - Filter bookings before this date
   * @property {number} page - Page number (default: 1)
   * @property {number} limit - Items per page (default: 10)
   * 
   * @example
   * GET /api/v1/venues/bookings?venueId=venue123&status=confirmed&page=1&limit=20
   */
  getBookings = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = validatePagination(req.query.page as string, req.query.limit as string);

    const filters: BookingFilterOptions = {};

    if (req.query.venueId) {
      filters.venueId = req.query.venueId as string;
    }

    if (req.query.userId) {
      filters.userId = req.query.userId as string;
    }

    if (req.query.status) {
      filters.status = req.query.status as BookingStatus;
    }

    if (req.query.paymentStatus) {
      filters.paymentStatus = req.query.paymentStatus as string;
    }

    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }

    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    const result = await this.bookingService.getBookings(filters, page, limit);

    sendSuccess(res, {
      bookings: result.bookings,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: result.pages,
      },
    });
  });

  /**
   * Get booking details by ID
   * 
   * Retrieves complete details for a specific booking including venue information,
   * user details, payment status, and booking timeline.
   * 
   * @async
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with booking details
   * 
   * @throws {NotFoundError} If booking doesn't exist
   * 
   * @example
   * GET /api/v1/venues/bookings/booking123
   */
  getBookingById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.params.id) {
      throw new Error('Booking ID is required');
    }

    const booking = await this.bookingService.getBookingById(req.params.id);

    sendSuccess(res, { booking });
  });

  /**
   * Get current user's bookings
   * 
   * Retrieves all bookings made by the authenticated user with optional status filtering.
   * Sorted by booking date (most recent first).
   * 
   * @async
   * @param {AuthRequest} req - Express request with user authentication
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with user's bookings
   * 
   * Query Parameters:
   * @property {string} status - Filter by booking status (optional)
   * 
   * @example
   * GET /api/v1/venues/bookings/my-bookings?status=confirmed
   */
  getMyBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const status = req.query.status as BookingStatus | undefined;

    const bookings = await this.bookingService.getUserBookings(userId, status);

    sendSuccess(res, { bookings });
  });

  /**
   * Update booking details
   * 
   * Modifies an existing booking's details. Only the booking creator can update.
   * Cannot update bookings that are already completed, cancelled, or in progress.
   * Checks availability if changing time slots.
   * 
   * @async
   * @param {AuthRequest} req - Express request with user authentication
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with updated booking
   * 
   * @throws {NotFoundError} If booking doesn't exist
   * @throws {ForbiddenError} If user is not the booking creator
   * @throws {ConflictError} If new time slot conflicts with other bookings
   * @throws {ValidationError} If booking status doesn't allow updates
   * 
   * Request Body (all fields optional):
   * @property {Date} startTime - New start time
   * @property {Date} endTime - New end time
   * @property {number} participants - Updated participant count
   * @property {string} purpose - Updated purpose
   * 
   * @example
   * PATCH /api/v1/venues/bookings/booking123
   * Body: {
   *   participants: 15,
   *   purpose: "Team training session"
   * }
   */
  updateBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const dto: UpdateBookingDTO = req.body;

    if (!req.params.id) {
      throw new Error('Booking ID is required');
    }

    const booking = await this.bookingService.updateBooking(req.params.id, userId, dto);

    logger.info('Booking updated', { bookingId: booking.id, userId });

    sendSuccess(res, { booking }, 'Booking updated successfully');
  });

  /**
   * Cancel a booking
   * 
   * Cancels an existing booking and processes refund if applicable.
   * Refund eligibility depends on cancellation time before booking start.
   * Updates booking status to 'cancelled' and releases venue availability.
   * 
   * Refund Policy:
   * - More than 24 hours before: Full refund
   * - 12-24 hours before: 50% refund
   * - Less than 12 hours: No refund
   * 
   * @async
   * @param {AuthRequest} req - Express request with user authentication
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with cancelled booking and refund details
   * 
   * @throws {NotFoundError} If booking doesn't exist
   * @throws {ForbiddenError} If user is not the booking creator
   * @throws {ValidationError} If booking already cancelled or completed
   * 
   * Request Body:
   * @property {string} reason - Reason for cancellation (optional)
   * 
   * @example
   * POST /api/v1/venues/bookings/booking123/cancel
   * Body: {
   *   reason: "Schedule conflict"
   * }
   * 
   * Response: {
   *   success: true,
   *   data: {
   *     booking: { status: "cancelled", ... },
   *     refund: { amount: 50.00, percentage: 100 }
   *   }
   * }
   */
  cancelBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const dto: CancelBookingDTO = req.body;

    if (!req.params.id) {
      throw new Error('Booking ID is required');
    }

    const booking = await this.bookingService.cancelBooking(req.params.id, userId, dto);

    logger.info('Booking cancelled', { bookingId: booking.id, userId });

    sendSuccess(res, { booking }, 'Booking cancelled successfully');
  });

  /**
   * Check venue availability
   * 
   * Checks if a venue is available for a specific time slot.
   * Returns availability status and conflicting bookings if any.
   * Does not require authentication.
   * 
   * @async
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with availability information
   * 
   * Request Body:
   * @property {string} venueId - ID of the venue to check
   * @property {Date} startTime - Desired start time
   * @property {Date} endTime - Desired end time
   * 
   * @example
   * POST /api/v1/venues/bookings/check-availability
   * Body: {
   *   venueId: "venue123",
   *   startTime: "2025-10-20T14:00:00Z",
   *   endTime: "2025-10-20T16:00:00Z"
   * }
   * 
   * Response: {
   *   success: true,
   *   data: {
   *     available: true,
   *     conflictingBookings: []
   *   }
   * }
   */
  checkAvailability = asyncHandler(async (req: Request, res: Response) => {
    const { venueId, startTime, endTime } = req.body;

    const result = await this.bookingService.checkAvailability(
      venueId,
      new Date(startTime),
      new Date(endTime)
    );

    sendSuccess(res, result);
  });

  /**
   * Confirm booking payment
   * 
   * Confirms payment for a pending booking and updates status to 'confirmed'.
   * Records transaction details for accounting and refund processing.
   * Typically called by payment gateway webhook or after successful payment.
   * 
   * @async
   * @param {AuthRequest} req - Express request with user authentication
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with confirmed booking
   * 
   * @throws {NotFoundError} If booking doesn't exist
   * @throws {ValidationError} If booking not in pending status
   * 
   * Request Body:
   * @property {string} transactionId - Payment gateway transaction ID
   * @property {string} paymentMethod - Payment method used (credit_card, paypal, etc.)
   * 
   * @example
   * POST /api/v1/venues/bookings/booking123/confirm-payment
   * Body: {
   *   transactionId: "txn_abc123",
   *   paymentMethod: "credit_card"
   * }
   */
  confirmPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { transactionId, paymentMethod } = req.body;

    if (!req.params.id) {
      throw new Error('Booking ID is required');
    }

    const booking = await this.bookingService.confirmPayment(
      req.params.id,
      transactionId,
      paymentMethod
    );

    logger.info('Payment confirmed', { bookingId: booking.id });

    sendSuccess(res, { booking }, 'Payment confirmed successfully');
  });

  /**
   * Check in to booking
   * 
   * Marks user as checked in when they arrive at the venue.
   * Can only check in within the booking time window.
   * Updates booking status to 'checked_in' and records check-in timestamp.
   * 
   * @async
   * @param {AuthRequest} req - Express request with user authentication
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with updated booking
   * 
   * @throws {NotFoundError} If booking doesn't exist
   * @throws {ForbiddenError} If user is not the booking creator
   * @throws {ValidationError} If not within booking time window or already checked in
   * 
   * @example
   * POST /api/v1/venues/bookings/booking123/checkin
   */
  checkIn = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);

    if (!req.params.id) {
      throw new Error('Booking ID is required');
    }

    const booking = await this.bookingService.checkIn(req.params.id, userId);

    logger.info('Checked in to booking', { bookingId: booking.id, userId });

    sendSuccess(res, { booking }, 'Checked in successfully');
  });

  /**
   * Check out from booking
   * 
   * Marks user as checked out when leaving the venue.
   * Completes the booking lifecycle. Updates status to 'completed' and
   * records checkout timestamp for billing and usage tracking.
   * 
   * @async
   * @param {AuthRequest} req - Express request with user authentication
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with completed booking
   * 
   * @throws {NotFoundError} If booking doesn't exist
   * @throws {ForbiddenError} If user is not the booking creator
   * @throws {ValidationError} If not checked in or already checked out
   * 
   * @example
   * POST /api/v1/venues/bookings/booking123/checkout
   */
  checkOut = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);

    if (!req.params.id) {
      throw new Error('Booking ID is required');
    }

    const booking = await this.bookingService.checkOut(req.params.id, userId);

    logger.info('Checked out from booking', { bookingId: booking.id, userId });

    sendSuccess(res, { booking }, 'Checked out successfully');
  });

  /**
   * Mark booking as no-show
   * 
   * Venue owners can mark a booking as no-show if the user fails to arrive.
   * Should be called after booking start time has passed without check-in.
   * No refund is processed for no-show bookings. Affects user's reliability score.
   * 
   * Authorization: Only venue owner can perform this action.
   * 
   * @async
   * @param {AuthRequest} req - Express request with user authentication
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with updated booking
   * 
   * @throws {NotFoundError} If booking doesn't exist
   * @throws {ForbiddenError} If user is not the venue owner
   * @throws {ValidationError} If booking start time hasn't passed or user already checked in
   * 
   * @example
   * POST /api/v1/venues/bookings/booking123/no-show
   * 
   * Response: {
   *   success: true,
   *   data: {
   *     booking: { status: "no_show", ... }
   *   },
   *   message: "Booking marked as no-show"
   * }
   */
  markNoShow = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);

    if (!req.params.id) {
      throw new Error('Booking ID is required');
    }

    const booking = await this.bookingService.markNoShow(req.params.id, userId);

    logger.info('Booking marked as no-show', { bookingId: booking.id });

    sendSuccess(res, { booking }, 'Booking marked as no-show');
  });

  /**
   * Get venue bookings (for venue owner)
   * GET /api/v1/venues/:venueId/bookings
   */
  getVenueBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const status = req.query.status as BookingStatus | undefined;

    if (!req.params.venueId) {
      throw new Error('Venue ID is required');
    }

    const bookings = await this.bookingService.getVenueBookings(req.params.venueId, userId, status);

    sendSuccess(res, { bookings });
  });

  /**
   * Get venue analytics (for venue owner)
   * GET /api/v1/venues/:venueId/analytics
   */
  getVenueAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    if (!req.params.venueId) {
      throw new Error('Venue ID is required');
    }

    const analytics = await this.bookingService.getVenueAnalytics(
      req.params.venueId,
      userId,
      startDate,
      endDate
    );

    sendSuccess(res, { analytics });
  });

  /**
   * Get venue booking calendar (for venue owner)
   * GET /api/v1/venues/:venueId/calendar
   */
  getVenueCalendar = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);

    if (!req.query.startDate || !req.query.endDate) {
      throw new Error('startDate and endDate are required');
    }

    if (!req.params.venueId) {
      throw new Error('Venue ID is required');
    }

    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);

    const bookings = await this.bookingService.getVenueCalendar(
      req.params.venueId,
      userId,
      startDate,
      endDate
    );

    sendSuccess(res, { bookings });
  });

  /**
   * Get dashboard statistics (for venue owner)
   * GET /api/v1/venues/bookings/dashboard/stats
   */
  getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);

    const stats = await this.bookingService.getDashboardStats(userId);

    sendSuccess(res, { stats });
  });
}

export const bookingController = new BookingController();
