import {Router} from "express";
import {body} from "express-validator";
import {authenticate, authorize} from "../../../../shared/middleware/auth";
import {validateRequest} from "../../../../shared/middleware/validation";
import {
  createTournamentValidation,
  idParamValidation,
} from "../../../../shared/validators";
import {tournamentController} from "../controllers/TournamentController";

/**
 * Tournament Routes Module
 *
 * Handles all tournament-related API endpoints including tournament creation,
 * bracket management, and participant registration. All routes require authentication.
 *
 * Base Path: /api/v1/tournaments
 *
 * Route Categories:
 * - Tournament Management: Create, list, view tournaments
 * - Bracket Operations: Generate and view tournament brackets
 * - Participation: Register for tournaments, view participants
 * - Match Management: Update match results, progress tournament
 *
 * Security:
 * - All routes require authentication (JWT token)
 * - Organizer-only operations: Bracket generation, match result updates
 * - Participant operations: Registration, viewing brackets
 *
 * Features:
 * - Multiple tournament formats (single/double elimination, round-robin)
 * - Automatic bracket generation
 * - Match progression tracking
 * - Participant limits and registration
 * - Status lifecycle (upcoming → ongoing → completed)
 */

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/tournaments:
 *   post:
 *     summary: Create a new tournament
 *     description: Create a tournament with bracket structure. Any authenticated user can create a tournament.
 *     tags:
 *       - Tournaments
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
 *               - sport
 *               - maxParticipants
 *               - startDate
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tournament name
 *                 example: "Summer Championship 2025"
 *               description:
 *                 type: string
 *                 description: Tournament description
 *                 example: "Annual summer football championship"
 *               sport:
 *                 type: string
 *                 description: Sport type
 *                 example: "football"
 *               maxParticipants:
 *                 type: integer
 *                 minimum: 2
 *                 description: Maximum number of participants
 *                 example: 16
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Tournament start date
 *                 example: "2025-06-15T10:00:00Z"
 *               venue:
 *                 type: string
 *                 description: Venue ID
 *                 example: "507f1f77bcf86cd799439011"
 *               prizePool:
 *                 type: number
 *                 description: Total prize pool amount
 *                 example: 5000
 *     responses:
 *       201:
 *         description: Tournament created successfully
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
 *                     tournament:
 *                       $ref: '#/components/schemas/Tournament'
 *                 message:
 *                   type: string
 *                   example: "Tournament created successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  "/",
  createTournamentValidation,
  validateRequest,
  tournamentController.createTournament
);

/**
 * @swagger
 * /api/v1/tournaments:
 *   get:
 *     summary: Get all tournaments
 *     description: Retrieve a paginated and filterable list of tournaments
 *     tags:
 *       - Tournaments
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
 *         description: Filter by sport
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, ongoing, completed, cancelled]
 *         description: Filter by tournament status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in tournament names
 *     responses:
 *       200:
 *         description: Tournaments retrieved successfully
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
 *                     tournaments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Tournament'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", tournamentController.getTournaments);

/**
 * @swagger
 * /api/v1/tournaments/{id}:
 *   get:
 *     summary: Get tournament by ID
 *     description: Retrieve detailed information about a specific tournament
 *     tags:
 *       - Tournaments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Tournament details retrieved successfully
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
 *                     tournament:
 *                       $ref: '#/components/schemas/Tournament'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/:id",
  idParamValidation,
  validateRequest,
  tournamentController.getTournamentById
);

/**
 * @swagger
 * /api/v1/tournaments/{id}/join:
 *   post:
 *     summary: Join a tournament
 *     description: Join an upcoming tournament as a participant
 *     tags:
 *       - Tournaments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Successfully joined tournament
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
 *                     tournament:
 *                       $ref: '#/components/schemas/Tournament'
 *                 message:
 *                   type: string
 *                   example: "Successfully joined tournament"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Conflict - Already joined or tournament is full
 */
router.post(
  "/:id/join",
  idParamValidation,
  validateRequest,
  tournamentController.joinTournament
);

/**
 * @swagger
 * /api/v1/tournaments/{id}/leave:
 *   post:
 *     summary: Leave a tournament
 *     description: Leave a tournament that hasn't started yet
 *     tags:
 *       - Tournaments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Successfully left tournament
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
 *                     tournament:
 *                       $ref: '#/components/schemas/Tournament'
 *                 message:
 *                   type: string
 *                   example: "Successfully left tournament"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  "/:id/leave",
  idParamValidation,
  validateRequest,
  tournamentController.leaveTournament
);

/**
 * @swagger
 * /api/v1/tournaments/{id}/start:
 *   put:
 *     summary: Start a tournament
 *     description: Start a tournament and generate bracket. Only tournament creator can start.
 *     tags:
 *       - Tournaments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Tournament started successfully
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
 *                     tournament:
 *                       $ref: '#/components/schemas/Tournament'
 *                 message:
 *                   type: string
 *                   example: "Tournament started successfully"
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
  "/:id/start",
  idParamValidation,
  validateRequest,
  tournamentController.startTournament
);

/**
 * @swagger
 * /api/v1/tournaments/{id}:
 *   put:
 *     summary: Update tournament
 *     description: Update tournament details. Only tournament creator can update.
 *     tags:
 *       - Tournaments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Tournament name
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Tournament description
 *               status:
 *                 type: string
 *                 enum: [upcoming, ongoing, completed, cancelled]
 *                 description: Tournament status
 *     responses:
 *       200:
 *         description: Tournament updated successfully
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
 *                     tournament:
 *                       $ref: '#/components/schemas/Tournament'
 *                 message:
 *                   type: string
 *                   example: "Tournament updated successfully"
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
  body("name")
    .optional()
    .trim()
    .isLength({min: 1, max: 100})
    .withMessage("Tournament name must be between 1 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({max: 1000})
    .withMessage("Description cannot exceed 1000 characters"),
  body("status")
    .optional()
    .isIn(["upcoming", "ongoing", "completed", "cancelled"])
    .withMessage("Invalid tournament status"),
  validateRequest,
  tournamentController.updateTournament
);

/**
 * @swagger
 * /api/v1/tournaments/{id}:
 *   delete:
 *     summary: Delete tournament
 *     description: Delete a tournament. Only admins and moderators can delete tournaments.
 *     tags:
 *       - Tournaments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Tournament deleted successfully
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
 *                   example: "Tournament deleted successfully"
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
  authorize(["admin", "moderator"]),
  tournamentController.deleteTournament
);

export default router;
