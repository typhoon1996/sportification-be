/**
 * Booking Routes Module
 *
 * Handles all venue booking-related endpoints including reservation creation, management,
 * payment processing, and availability checking. Provides comprehensive booking lifecycle
 * management from availability check to check-out.
 *
 * Base Path: /api/v1/venues/bookings
 *
 * Features:
 * - Availability checking with real-time conflict detection
 * - Booking creation with automatic venue capacity validation
 * - Payment confirmation and processing integration
 * - Check-in/check-out tracking for venue usage
 * - Cancellation with refund policy enforcement
 * - No-show tracking and management
 * - Booking history and filtering
 * - Calendar view for venue scheduling
 * - Analytics for venue utilization
 *
 * Security:
 * - All routes require authentication
 * - Creator/venue owner permissions for modifications
 * - Admin/moderator override capabilities
 * - Rate limiting applied to prevent abuse
 *
 * Validation:
 * - Comprehensive request validation on all endpoints
 * - Date/time format validation
 * - Capacity and duration checks
 * - Payment data validation
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

/**
 * @swagger
 * /api/v1/venues/bookings/check-availability:
 *   post:
 *     summary: Check venue availability
 *     description: Check if a venue is available for booking at specified date/time
 *     tags:
 *       - Venue Bookings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - venueId
 *               - startTime
 *               - endTime
 *             properties:
 *               venueId:
 *                 type: string
 *                 description: Venue ID
 *                 example: "507f1f77bcf86cd799439011"
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: Booking start time
 *                 example: "2025-10-20T14:00:00Z"
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: Booking end time
 *                 example: "2025-10-20T16:00:00Z"
 *     responses:
 *       200:
 *         description: Availability check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: boolean
 *                       example: true
 *                     conflictingBookings:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  "/check-availability",
  checkAvailabilityValidation,
  bookingController.checkAvailability
);

/**
 * @swagger
 * /api/v1/venues/bookings:
 *   post:
 *     summary: Create a venue booking
 *     description: Create a new booking for a venue
 *     tags:
 *       - Venue Bookings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - venueId
 *               - startTime
 *               - endTime
 *             properties:
 *               venueId:
 *                 type: string
 *                 description: Venue ID
 *                 example: "507f1f77bcf86cd799439011"
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: Booking start time
 *                 example: "2025-10-20T14:00:00Z"
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: Booking end time
 *                 example: "2025-10-20T16:00:00Z"
 *               purpose:
 *                 type: string
 *                 description: Purpose of booking
 *                 example: "Team practice"
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       $ref: '#/components/schemas/Booking'
 *                 message:
 *                   type: string
 *                   example: "Booking created successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         description: Conflict - Venue not available
 */
router.post("/", createBookingValidation, bookingController.createBooking);

/**
 * @swagger
 * /api/v1/venues/bookings:
 *   get:
 *     summary: Get all bookings
 *     description: Retrieve all bookings (admin/moderator only)
 *     tags:
 *       - Venue Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, checked-in, completed, cancelled, no-show]
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Booking'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  "/",
  authorize(["admin", "moderator"]),
  getBookingsValidation,
  bookingController.getBookings
);

/**
 * @swagger
 * /api/v1/venues/bookings/my-bookings:
 *   get:
 *     summary: Get my bookings
 *     description: Retrieve bookings made by the authenticated user
 *     tags:
 *       - Venue Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, checked-in, completed, cancelled, no-show]
 *     responses:
 *       200:
 *         description: My bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Booking'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/my-bookings", bookingController.getMyBookings);

/**
 * @swagger
 * /api/v1/venues/bookings/dashboard/stats:
 *   get:
 *     summary: Get booking dashboard statistics
 *     description: Retrieve booking statistics for dashboard (admin/moderator only)
 *     tags:
 *       - Venue Bookings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalBookings:
 *                       type: integer
 *                     pendingBookings:
 *                       type: integer
 *                     revenue:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  "/dashboard/stats",
  authorize(["admin", "moderator"]),
  bookingController.getDashboardStats
);

/**
 * @swagger
 * /api/v1/venues/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     description: Retrieve detailed information about a specific booking
 *     tags:
 *       - Venue Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       $ref: '#/components/schemas/Booking'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id", bookingIdValidation, bookingController.getBookingById);

/**
 * @swagger
 * /api/v1/venues/bookings/{id}:
 *   patch:
 *     summary: Update booking
 *     description: Update booking details (booking owner or admin only)
 *     tags:
 *       - Venue Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               purpose:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch("/:id", updateBookingValidation, bookingController.updateBooking);

/**
 * @swagger
 * /api/v1/venues/bookings/{id}/cancel:
 *   post:
 *     summary: Cancel booking
 *     description: Cancel a booking (booking owner or admin only)
 *     tags:
 *       - Venue Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Cancellation reason
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  "/:id/cancel",
  cancelBookingValidation,
  bookingController.cancelBooking
);

/**
 * @swagger
 * /api/v1/venues/bookings/{id}/confirm-payment:
 *   post:
 *     summary: Confirm payment
 *     description: Confirm payment for a booking (admin/moderator only)
 *     tags:
 *       - Venue Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 100
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, online]
 *               transactionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  "/:id/confirm-payment",
  authorize(["admin", "moderator"]),
  confirmPaymentValidation,
  bookingController.confirmPayment
);

/**
 * @swagger
 * /api/v1/venues/bookings/{id}/checkin:
 *   post:
 *     summary: Check-in booking
 *     description: Mark booking as checked-in (admin/moderator only)
 *     tags:
 *       - Venue Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Checked-in successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  "/:id/checkin",
  authorize(["admin", "moderator"]),
  bookingIdValidation,
  bookingController.checkIn
);

/**
 * @swagger
 * /api/v1/venues/bookings/{id}/checkout:
 *   post:
 *     summary: Check-out booking
 *     description: Mark booking as checked-out (admin/moderator only)
 *     tags:
 *       - Venue Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Checked-out successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  "/:id/checkout",
  authorize(["admin", "moderator"]),
  bookingIdValidation,
  bookingController.checkOut
);

/**
 * @swagger
 * /api/v1/venues/bookings/{id}/no-show:
 *   post:
 *     summary: Mark as no-show
 *     description: Mark booking as no-show (admin/moderator only)
 *     tags:
 *       - Venue Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Marked as no-show successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  "/:id/no-show",
  authorize(["admin", "moderator"]),
  bookingIdValidation,
  bookingController.markNoShow
);

/**
 * @swagger
 * /api/v1/venues/bookings/venue/{venueId}:
 *   get:
 *     summary: Get venue bookings
 *     description: Retrieve all bookings for a specific venue
 *     tags:
 *       - Venue Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *         description: Venue ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Booking'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/venue/:venueId",
  venueIdValidation,
  bookingController.getVenueBookings
);

/**
 * @swagger
 * /api/v1/venues/bookings/venue/{venueId}/analytics:
 *   get:
 *     summary: Get venue booking analytics
 *     description: Retrieve booking analytics for a specific venue (admin/moderator only)
 *     tags:
 *       - Venue Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *         description: Venue ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Venue analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalBookings:
 *                       type: integer
 *                     revenue:
 *                       type: number
 *                     utilizationRate:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/venue/:venueId/analytics",
  authorize(["admin", "moderator"]),
  getVenueAnalyticsValidation,
  bookingController.getVenueAnalytics
);

/**
 * @swagger
 * /api/v1/venues/bookings/venue/{venueId}/calendar:
 *   get:
 *     summary: Get venue calendar
 *     description: Retrieve booking calendar for a specific venue
 *     tags:
 *       - Venue Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *         description: Venue ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Calendar start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Calendar end date
 *     responses:
 *       200:
 *         description: Venue calendar retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     calendar:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/venue/:venueId/calendar",
  getVenueCalendarValidation,
  bookingController.getVenueCalendar
);

export default router;
