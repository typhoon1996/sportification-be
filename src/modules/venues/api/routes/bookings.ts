/**
 * Booking Routes
 */

import { Router } from 'express';
import { bookingController } from '../controllers/BookingController';
import { authenticate } from '../../../../shared/middleware/auth';
import {
  createBookingValidation,
  updateBookingValidation,
  cancelBookingValidation,
  checkAvailabilityValidation,
  confirmPaymentValidation,
  bookingIdValidation,
  venueIdValidation,
  getBookingsValidation,
  getVenueCalendarValidation,
  getVenueAnalyticsValidation,
} from '../validators/booking.validators';

const router = Router();

// Public routes
router.post(
  '/check-availability',
  checkAvailabilityValidation,
  bookingController.checkAvailability
);

// Protected routes - require authentication
router.post('/', authenticate, createBookingValidation, bookingController.createBooking);

router.get('/', authenticate, getBookingsValidation, bookingController.getBookings);

router.get('/my-bookings', authenticate, bookingController.getMyBookings);

router.get('/dashboard/stats', authenticate, bookingController.getDashboardStats);

router.get('/:id', authenticate, bookingIdValidation, bookingController.getBookingById);

router.patch('/:id', authenticate, updateBookingValidation, bookingController.updateBooking);

router.post('/:id/cancel', authenticate, cancelBookingValidation, bookingController.cancelBooking);

router.post(
  '/:id/confirm-payment',
  authenticate,
  confirmPaymentValidation,
  bookingController.confirmPayment
);

router.post('/:id/checkin', authenticate, bookingIdValidation, bookingController.checkIn);

router.post('/:id/checkout', authenticate, bookingIdValidation, bookingController.checkOut);

router.post('/:id/no-show', authenticate, bookingIdValidation, bookingController.markNoShow);

// Venue-specific booking routes
router.get('/venue/:venueId', authenticate, venueIdValidation, bookingController.getVenueBookings);

router.get(
  '/venue/:venueId/analytics',
  authenticate,
  getVenueAnalyticsValidation,
  bookingController.getVenueAnalytics
);

router.get(
  '/venue/:venueId/calendar',
  authenticate,
  getVenueCalendarValidation,
  bookingController.getVenueCalendar
);

export default router;
