/**
 * Booking Controller - API Layer
 */

import { Request, Response } from 'express';
import { BookingService } from '../../domain/services/BookingService';
import { sendSuccess, sendCreated, asyncHandler } from '../../../../shared/middleware/errorHandler';
import { AuthRequest } from '../../../../shared/middleware/auth';
import { validatePagination } from '../../../../shared/middleware/validation';
import logger from '../../../../shared/utils/logger';
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
   * Create a new booking
   * POST /api/v1/venues/bookings
   */
  createBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const dto: CreateBookingDTO = req.body;

    const booking = await this.bookingService.createBooking(userId, dto);

    logger.info('Booking created', { bookingId: booking.id, userId });

    sendCreated(res, { booking }, 'Booking created successfully');
  });

  /**
   * Get bookings with filters
   * GET /api/v1/venues/bookings
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
   * Get booking by ID
   * GET /api/v1/venues/bookings/:id
   */
  getBookingById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.params.id) {
      throw new Error('Booking ID is required');
    }

    const booking = await this.bookingService.getBookingById(req.params.id);

    sendSuccess(res, { booking });
  });

  /**
   * Get user's bookings
   * GET /api/v1/venues/bookings/my-bookings
   */
  getMyBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const status = req.query.status as BookingStatus | undefined;

    const bookings = await this.bookingService.getUserBookings(userId, status);

    sendSuccess(res, { bookings });
  });

  /**
   * Update booking
   * PATCH /api/v1/venues/bookings/:id
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
   * Cancel booking
   * POST /api/v1/venues/bookings/:id/cancel
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
   * Check availability
   * POST /api/v1/venues/bookings/check-availability
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
   * Confirm payment
   * POST /api/v1/venues/bookings/:id/confirm-payment
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
   * POST /api/v1/venues/bookings/:id/checkin
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
   * POST /api/v1/venues/bookings/:id/checkout
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
   * Mark booking as no-show (venue owner only)
   * POST /api/v1/venues/bookings/:id/no-show
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
