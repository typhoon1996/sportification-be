import {Router} from "express";
import {venueController} from "../controllers/VenueController";
import {authenticate, authorize} from "../../../../shared/middleware/auth";
import {validateRequest} from "../../../../shared/middleware/validation";
import {
  createVenueValidation,
  idParamValidation,
} from "../../../../shared/validators";
import bookingRoutes from "./bookings";

const router = Router();

// Booking routes - mounted at /bookings (has its own auth)
router.use("/bookings", bookingRoutes);

// All venue routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/venues:
 *   post:
 *     summary: Create a new venue
 *     description: Create a sports venue. Only admins and moderators can create venues.
 *     tags:
 *       - Venues
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *               - sports
 *             properties:
 *               name:
 *                 type: string
 *                 description: Venue name
 *                 example: "City Sports Complex"
 *               description:
 *                 type: string
 *                 description: Venue description
 *                 example: "Modern indoor/outdoor sports facility"
 *               location:
 *                 type: object
 *                 required:
 *                   - type
 *                   - coordinates
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [Point]
 *                     example: "Point"
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     example: [-73.935242, 40.730610]
 *                   address:
 *                     type: string
 *                     example: "123 Main St, New York, NY 10001"
 *               sports:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["football", "basketball", "tennis"]
 *               facilities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["parking", "lockers", "showers"]
 *               pricing:
 *                 type: object
 *                 properties:
 *                   hourly:
 *                     type: number
 *                     example: 50
 *     responses:
 *       201:
 *         description: Venue created successfully
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
 *                     venue:
 *                       $ref: '#/components/schemas/Venue'
 *                 message:
 *                   type: string
 *                   example: "Venue created successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  "/",
  authorize(["admin", "moderator"]),
  createVenueValidation,
  validateRequest,
  venueController.createVenue
);

/**
 * @swagger
 * /api/v1/venues:
 *   get:
 *     summary: Get all venues
 *     description: Retrieve a list of venues with optional geospatial filtering
 *     tags:
 *       - Venues
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *         description: Filter by sport type
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Latitude for geospatial search
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         description: Longitude for geospatial search
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 5000
 *         description: Search radius in meters (requires lat/lng)
 *     responses:
 *       200:
 *         description: Venues retrieved successfully
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
 *                     venues:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Venue'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", venueController.getVenues);

/**
 * @swagger
 * /api/v1/venues/{id}:
 *   get:
 *     summary: Get venue by ID
 *     description: Retrieve detailed information about a specific venue
 *     tags:
 *       - Venues
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Venue ID
 *     responses:
 *       200:
 *         description: Venue details retrieved successfully
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
 *                     venue:
 *                       $ref: '#/components/schemas/Venue'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/:id",
  idParamValidation,
  validateRequest,
  venueController.getVenueById
);

/**
 * @swagger
 * /api/v1/venues/{id}:
 *   put:
 *     summary: Update venue
 *     description: Update venue details. Only admins and moderators can update venues.
 *     tags:
 *       - Venues
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Venue ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Venue name
 *               description:
 *                 type: string
 *                 description: Venue description
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [Point]
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                   address:
 *                     type: string
 *               sports:
 *                 type: array
 *                 items:
 *                   type: string
 *               facilities:
 *                 type: array
 *                 items:
 *                   type: string
 *               pricing:
 *                 type: object
 *     responses:
 *       200:
 *         description: Venue updated successfully
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
 *                     venue:
 *                       $ref: '#/components/schemas/Venue'
 *                 message:
 *                   type: string
 *                   example: "Venue updated successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put(
  "/:id",
  idParamValidation,
  authorize(["admin", "moderator"]),
  createVenueValidation,
  validateRequest,
  venueController.updateVenue
);

/**
 * @swagger
 * /api/v1/venues/{id}:
 *   delete:
 *     summary: Delete venue
 *     description: Delete a venue. Only admins can delete venues.
 *     tags:
 *       - Venues
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Venue ID
 *     responses:
 *       200:
 *         description: Venue deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Venue deleted successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  "/:id",
  idParamValidation,
  validateRequest,
  authorize(["admin"]),
  venueController.deleteVenue
);

export default router;
