import {Router} from "express";
import {matchController} from "../controllers/MatchController";
import {authenticate, authorize} from "../../../../shared/middleware/auth";
import {validateRequest} from "../../../../shared/middleware/validation";
import {
  createMatchValidation,
  idParamValidation,
} from "../../../../shared/validators";
import {body} from "express-validator";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /matches:
 *   post:
 *     summary: Create a new match
 *     description: Create a new match with specified details (Any authenticated user)
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sport
 *               - schedule
 *             properties:
 *               sport:
 *                 type: string
 *                 example: football
 *               type:
 *                 type: string
 *                 enum: [public, private]
 *                 default: public
 *               schedule:
 *                 type: object
 *                 required:
 *                   - date
 *                   - time
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date
 *                     example: 2025-10-20
 *                   time:
 *                     type: string
 *                     example: "18:00"
 *                   duration:
 *                     type: integer
 *                     example: 90
 *               venue:
 *                 type: string
 *                 description: Venue ID
 *               maxParticipants:
 *                 type: integer
 *                 minimum: 2
 *                 maximum: 100
 *                 example: 10
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: Friendly football match
 *               rules:
 *                 type: object
 *     responses:
 *       201:
 *         description: Match created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Match created successfully
 *               data:
 *                 match:
 *                   id: 507f1f77bcf86cd799439011
 *                   sport: football
 *                   type: public
 *                   status: upcoming
 *                   schedule:
 *                     date: 2025-10-20
 *                     time: "18:00"
 *                   participants: []
 *                   maxParticipants: 10
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  "/",
  createMatchValidation,
  validateRequest,
  matchController.createMatch
);

/**
 * @swagger
 * /matches:
 *   get:
 *     summary: Get all matches
 *     description: Retrieve a paginated list of matches with optional filters
 *     tags: [Matches]
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
 *         description: Results per page
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *         description: Filter by sport
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, ongoing, completed, expired, cancelled]
 *         description: Filter by match status
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter matches from this date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter matches until this date
 *       - in: query
 *         name: venue
 *         schema:
 *           type: string
 *         description: Filter by venue ID
 *     responses:
 *       200:
 *         description: Matches retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Matches retrieved successfully
 *               data:
 *                 matches:
 *                   - id: 507f1f77bcf86cd799439011
 *                     sport: football
 *                     status: upcoming
 *                     schedule:
 *                       date: 2025-10-20
 *                       time: "18:00"
 *               meta:
 *                 pagination:
 *                   page: 1
 *                   limit: 10
 *                   total: 50
 *                   pages: 5
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", matchController.getMatches);

/**
 * @swagger
 * /matches/{id}:
 *   get:
 *     summary: Get match by ID
 *     description: Retrieve detailed information about a specific match
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Match retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Match retrieved successfully
 *               data:
 *                 match:
 *                   id: 507f1f77bcf86cd799439011
 *                   sport: football
 *                   status: upcoming
 *                   createdBy:
 *                     id: 507f1f77bcf86cd799439012
 *                     profile:
 *                       firstName: John
 *                       lastName: Doe
 *                   participants: []
 *                   schedule:
 *                     date: 2025-10-20
 *                     time: "18:00"
 *                   venue:
 *                     id: 507f1f77bcf86cd799439013
 *                     name: City Stadium
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/:id",
  idParamValidation,
  validateRequest,
  matchController.getMatchById
);

/**
 * @swagger
 * /matches/{id}/join:
 *   post:
 *     summary: Join a match
 *     description: Add the authenticated user as a participant in the match
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Joined match successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Joined match successfully
 *               data:
 *                 match:
 *                   id: 507f1f77bcf86cd799439011
 *                   participants:
 *                     - 507f1f77bcf86cd799439012
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post(
  "/:id/join",
  idParamValidation,
  validateRequest,
  matchController.joinMatch
);

/**
 * @swagger
 * /matches/{id}/leave:
 *   post:
 *     summary: Leave a match
 *     description: Remove the authenticated user from match participants
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Left match successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Left match successfully
 *               data: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  "/:id/leave",
  idParamValidation,
  validateRequest,
  matchController.leaveMatch
);

/**
 * @swagger
 * /matches/{id}/score:
 *   put:
 *     summary: Update match score
 *     description: Update the score for a match (Creator or participants only)
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scores:
 *                 type: object
 *                 example:
 *                   team1: 2
 *                   team2: 1
 *               winner:
 *                 type: string
 *                 description: User ID of the winner
 *     responses:
 *       200:
 *         description: Score updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Score updated successfully
 *               data:
 *                 match:
 *                   id: 507f1f77bcf86cd799439011
 *                   scores:
 *                     team1: 2
 *                     team2: 1
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
  "/:id/score",
  idParamValidation,
  body("scores").optional().isObject().withMessage("Scores must be an object"),
  body("winner")
    .optional()
    .isMongoId()
    .withMessage("Winner must be a valid user ID"),
  validateRequest,
  matchController.updateScore
);

/**
 * @swagger
 * /matches/{id}/status:
 *   put:
 *     summary: Update match status
 *     description: Change the status of a match (Creator only)
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [upcoming, ongoing, completed, expired, cancelled]
 *                 example: ongoing
 *     responses:
 *       200:
 *         description: Match status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Match status updated successfully
 *               data:
 *                 match:
 *                   id: 507f1f77bcf86cd799439011
 *                   status: ongoing
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
  "/:id/status",
  idParamValidation,
  body("status")
    .isIn(["upcoming", "ongoing", "completed", "expired", "cancelled"])
    .withMessage("Invalid match status"),
  validateRequest,
  matchController.updateMatchStatus
);

/**
 * @swagger
 * /matches/{id}:
 *   delete:
 *     summary: Delete a match
 *     description: Delete a match (Admin/Moderator only)
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Match deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Match deleted successfully
 *               data: null
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
  matchController.deleteMatch
);

export default router;
