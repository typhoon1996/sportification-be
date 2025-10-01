import { Router } from 'express';
import { VenueController } from '../controllers/VenueController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { 
  createVenueValidation,
  getUserValidation
} from '../validators';

const router = Router();

/**
 * @swagger
 * /venues:
 *   post:
 *     summary: Create a new venue
 *     tags: [Venues]
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
 *               - surfaceType
 *             properties:
 *               name:
 *                 type: string
 *                 example: Central Park Tennis Courts
 *               description:
 *                 type: string
 *                 example: Premium outdoor tennis facility
 *               location:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 40.7829
 *                   lng:
 *                     type: number
 *                     example: -73.9654
 *                   address:
 *                     type: string
 *                     example: 1 Central Park West
 *                   city:
 *                     type: string
 *                     example: New York
 *                   country:
 *                     type: string
 *                     example: USA
 *               surfaceType:
 *                 type: string
 *                 enum: [grass, clay, hard, indoor, outdoor, sand, pool, court]
 *                 example: hard
 *     responses:
 *       201:
 *         description: Venue created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, createVenueValidation, validateRequest, VenueController.createVenue);

/**
 * @swagger
 * /venues:
 *   get:
 *     summary: Get all venues with filtering
 *     tags: [Venues]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of venues per page
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Latitude for nearby search
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         description: Longitude for nearby search
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: number
 *         description: Maximum distance in kilometers
 *       - in: query
 *         name: surfaceType
 *         schema:
 *           type: string
 *         description: Filter by surface type
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *     responses:
 *       200:
 *         description: List of venues retrieved successfully
 */
router.get('/', VenueController.getVenues);

/**
 * @swagger
 * /venues/search:
 *   get:
 *     summary: Search venues by name or description
 *     tags: [Venues]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/search', VenueController.searchVenues);

/**
 * @swagger
 * /venues/nearby:
 *   get:
 *     summary: Find nearby venues
 *     tags: [Venues]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: number
 *           default: 10
 *         description: Maximum distance in kilometers
 *     responses:
 *       200:
 *         description: Nearby venues retrieved successfully
 */
router.get('/nearby', VenueController.findNearbyVenues);

/**
 * @swagger
 * /venues/amenities:
 *   get:
 *     summary: Get venues by amenities
 *     tags: [Venues]
 *     parameters:
 *       - in: query
 *         name: amenities
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated list of amenities
 *         example: parking,restrooms,lighting
 *     responses:
 *       200:
 *         description: Venues with requested amenities
 */
router.get('/amenities', VenueController.getVenuesByAmenities);

/**
 * @swagger
 * /venues/{id}:
 *   get:
 *     summary: Get venue by ID
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Venue ID
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Your latitude (for distance calculation)
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         description: Your longitude (for distance calculation)
 *     responses:
 *       200:
 *         description: Venue details retrieved successfully
 *       404:
 *         description: Venue not found
 */
router.get('/:id', getUserValidation, validateRequest, VenueController.getVenueById);

/**
 * @swagger
 * /venues/{id}/availability:
 *   get:
 *     summary: Check venue availability
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: time
 *         schema:
 *           type: string
 *           format: time
 *     responses:
 *       200:
 *         description: Availability information retrieved
 */
router.get('/:id/availability', getUserValidation, validateRequest, VenueController.checkAvailability);

/**
 * @swagger
 * /venues/{id}:
 *   put:
 *     summary: Update venue details
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not the venue creator
 */
router.put('/:id', authenticate, getUserValidation, validateRequest, VenueController.updateVenue);

/**
 * @swagger
 * /venues/{id}:
 *   delete:
 *     summary: Delete venue
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not the venue creator
 */
router.delete('/:id', authenticate, getUserValidation, validateRequest, VenueController.deleteVenue);

/**
 * @swagger
 * /venues/user/{userId}:
 *   get:
 *     summary: Get user's venues
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User venues retrieved successfully
 */
router.get('/user/:userId', getUserValidation, validateRequest, VenueController.getUserVenues);

export default router;