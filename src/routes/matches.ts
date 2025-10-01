import { Router } from 'express';
import { MatchController } from '../controllers/MatchController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { 
  createMatchValidation,
  getUserValidation
} from '../validators';

const router = Router();

/**
 * @swagger
 * /matches:
 *   post:
 *     summary: Create a new match
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
 *               - type
 *               - sport
 *               - schedule
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [public, private, tournament]
 *                 example: public
 *               sport:
 *                 type: string
 *                 example: football
 *               schedule:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: 2024-01-15T00:00:00.000Z
 *                   time:
 *                     type: string
 *                     example: "18:00"
 *                   timezone:
 *                     type: string
 *                     example: UTC
 *               venue:
 *                 type: string
 *                 example: venue-object-id
 *               maxPlayers:
 *                 type: number
 *                 example: 10
 *               description:
 *                 type: string
 *                 example: Friendly football match
 *     responses:
 *       201:
 *         description: Match created successfully
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */
router.post('/', authenticate, createMatchValidation, validateRequest, MatchController.createMatch);

/**
 * @swagger
 * /matches:
 *   get:
 *     summary: Get all matches with optional filtering
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *         description: Filter by sport
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, ongoing, completed, cancelled]
 *         description: Filter by match status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of matches per page
 *     responses:
 *       200:
 *         description: Matches retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/', optionalAuthenticate, MatchController.getMatches);

/**
 * @swagger
 * /matches/{id}:
 *   get:
 *     summary: Get match by ID
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
 *         description: Match details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Match not found
 */
router.get('/:id', optionalAuthenticate, getUserValidation, validateRequest, MatchController.getMatchById);

/**
 * @swagger
 * /matches/{id}/join:
 *   post:
 *     summary: Join a match
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
 *         description: Successfully joined match
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Match full or permission denied
 *       404:
 *         description: Match not found
 */
router.post('/:id/join', authenticate, getUserValidation, validateRequest, MatchController.joinMatch);

/**
 * @swagger
 * /matches/{id}/join:
 *   delete:
 *     summary: Leave a match
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
 *         description: Successfully left match
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Match not found or user not in match
 */
router.delete('/:id/join', authenticate, getUserValidation, validateRequest, MatchController.leaveMatch);

/**
 * @swagger
 * /matches/{id}/score:
 *   put:
 *     summary: Update match score
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
 *               score:
 *                 type: object
 *                 properties:
 *                   team1:
 *                     type: number
 *                     example: 2
 *                   team2:
 *                     type: number
 *                     example: 1
 *     responses:
 *       200:
 *         description: Score updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a participant in the match
 *       404:
 *         description: Match not found
 */
router.put('/:id/score', authenticate, getUserValidation, validateRequest, MatchController.updateScore);

/**
 * @swagger
 * /matches/{id}/status:
 *   put:
 *     summary: Update match status (creator only)
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
 *               status:
 *                 type: string
 *                 enum: [scheduled, ongoing, completed, cancelled]
 *                 example: ongoing
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not the match creator
 *       404:
 *         description: Match not found
 */
router.put('/:id/status', authenticate, getUserValidation, validateRequest, MatchController.updateMatchStatus);

/**
 * @swagger
 * /matches/{id}:
 *   delete:
 *     summary: Delete match (creator only)
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not the match creator
 *       404:
 *         description: Match not found
 */
router.delete('/:id', authenticate, getUserValidation, validateRequest, MatchController.deleteMatch);

/**
 * @swagger
 * /matches/user/{userId}:
 *   get:
 *     summary: Get user's matches
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, ongoing, completed, cancelled]
 *         description: Filter by match status
 *     responses:
 *       200:
 *         description: User matches retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', optionalAuthenticate, getUserValidation, validateRequest, MatchController.getUserMatches);

export default router;