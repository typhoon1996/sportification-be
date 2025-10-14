/**
 * Booking Routes
 */

import {Router} from "express";
import {bookingController} from "../controllers/BookingController";
import {authenticate, authorize} from "../../../../shared/middleware/auth";
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
} from "../validators/booking.validators";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Booking availability check
router.post(
  "/check-availability",
  checkAvailabilityValidation,
  bookingController.checkAvailability
);

// Booking management
router.post("/", createBookingValidation, bookingController.createBooking);

router.get(
  "/",
  authorize(["admin", "moderator"]),
  getBookingsValidation,
  bookingController.getBookings
); // Admin/moderator only

router.get("/my-bookings", bookingController.getMyBookings); // Any authenticated user

router.get(
  "/dashboard/stats",
  authorize(["admin", "moderator"]),
  bookingController.getDashboardStats
); // Admin/moderator only

router.get("/:id", bookingIdValidation, bookingController.getBookingById); // Any authenticated user

router.patch("/:id", updateBookingValidation, bookingController.updateBooking); // Booking owner or admin

router.post(
  "/:id/cancel",
  cancelBookingValidation,
  bookingController.cancelBooking
); // Booking owner or admin

router.post(
  "/:id/confirm-payment",
  authorize(["admin", "moderator"]),
  confirmPaymentValidation,
  bookingController.confirmPayment
); // Admin/moderator only

router.post(
  "/:id/checkin",
  authorize(["admin", "moderator"]),
  bookingIdValidation,
  bookingController.checkIn
); // Admin/moderator only

router.post(
  "/:id/checkout",
  authorize(["admin", "moderator"]),
  bookingIdValidation,
  bookingController.checkOut
); // Admin/moderator only

router.post(
  "/:id/no-show",
  authorize(["admin", "moderator"]),
  bookingIdValidation,
  bookingController.markNoShow
); // Admin/moderator only

// Venue-specific booking routes
router.get(
  "/venue/:venueId",
  venueIdValidation,
  bookingController.getVenueBookings
); // Any authenticated user

router.get(
  "/venue/:venueId/analytics",
  authorize(["admin", "moderator"]),
  getVenueAnalyticsValidation,
  bookingController.getVenueAnalytics
); // Admin/moderator only

router.get(
  "/venue/:venueId/calendar",
  getVenueCalendarValidation,
  bookingController.getVenueCalendar
); // Any authenticated user

export default router;
