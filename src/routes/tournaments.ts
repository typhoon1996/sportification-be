import { Router } from 'express';
import { TournamentController } from '../controllers/TournamentController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { 
  createTournamentValidation,
  getUserValidation
} from '../validators';

const router = Router();

/**
 * @swagger
 * /tournaments:
 *   post:
 *     summary: Create a new tournament
 *     tags: [Tournaments]
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
 *               - type
 *               - schedule
 *             properties:
 *               name:
 *                 type: string
 *                 example: Summer Championship 2024
 *               sport:
 *                 type: string
 *                 example: tennis
 *               type:
 *                 type: string
 *                 enum: [single_elimination, double_elimination, round_robin, swiss]
 *                 example: single_elimination
 *               schedule:
 *                 type: object
 *                 properties:
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                     example: 2024-06-01T09:00:00.000Z
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                     example: 2024-06-07T18:00:00.000Z
 *               maxParticipants:
 *                 type: number
 *                 example: 32
 *               entryFee:
 *                 type: number
 *                 example: 25.00
 *               description:
 *                 type: string
 *                 example: Annual summer tennis championship
 *               venue:
 *                 type: string
 *                 example: venue-object-id
 *     responses:
 *       201:
 *         description: Tournament created successfully
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */
router.post('/', authenticate, createTournamentValidation, validateRequest, TournamentController.createTournament);

/**
 * @swagger
 * /tournaments:
 *   get:
 *     summary: Get all tournaments with optional filtering
 *     tags: [Tournaments]
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
 *           enum: [upcoming, ongoing, completed, cancelled]
 *         description: Filter by tournament status
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
 *         description: Number of tournaments per page
 *     responses:
 *       200:
 *         description: Tournaments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/', optionalAuthenticate, TournamentController.getTournaments);

/**
 * @swagger
 * /tournaments/{id}:
 *   get:
 *     summary: Get tournament by ID
 *     tags: [Tournaments]
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
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Tournament not found
 */
router.get('/:id', optionalAuthenticate, getUserValidation, validateRequest, TournamentController.getTournamentById);

/**
 * @swagger
 * /tournaments/{id}/join:
 *   post:
 *     summary: Join a tournament
 *     tags: [Tournaments]
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Tournament full or permission denied
 *       404:
 *         description: Tournament not found
 */
router.post('/:id/join', authenticate, getUserValidation, validateRequest, TournamentController.joinTournament);

/**
 * @swagger
 * /tournaments/{id}/join:
 *   delete:
 *     summary: Leave a tournament
 *     tags: [Tournaments]
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tournament not found or user not in tournament
 */
router.delete('/:id/join', authenticate, getUserValidation, validateRequest, TournamentController.leaveTournament);

/**
 * @swagger
 * /tournaments/{id}/start:
 *   post:
 *     summary: Start tournament (creator only)
 *     tags: [Tournaments]
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not the tournament creator
 *       404:
 *         description: Tournament not found
 *       409:
 *         description: Tournament cannot be started (insufficient participants, etc.)
 */
router.post('/:id/start', authenticate, getUserValidation, validateRequest, TournamentController.startTournament);

/**
 * @swagger
 * /tournaments/{id}/bracket:
 *   put:
 *     summary: Update tournament bracket
 *     tags: [Tournaments]
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
 *               bracket:
 *                 type: object
 *                 description: Tournament bracket data structure
 *               matchResults:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     matchId:
 *                       type: string
 *                     winnerId:
 *                       type: string
 *                     score:
 *                       type: object
 *     responses:
 *       200:
 *         description: Bracket updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Tournament not found
 */
router.put('/:id/bracket', authenticate, getUserValidation, validateRequest, TournamentController.updateBracket);

/**
 * @swagger
 * /tournaments/{id}/bracket:
 *   get:
 *     summary: Get tournament bracket
 *     tags: [Tournaments]
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
 *         description: Tournament bracket retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Tournament not found
 */
router.get('/:id/bracket', optionalAuthenticate, getUserValidation, validateRequest, TournamentController.getTournamentBracket);

/**
 * @swagger
 * /tournaments/{id}/standings:
 *   get:
 *     summary: Get tournament standings
 *     tags: [Tournaments]
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
 *         description: Tournament standings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Tournament not found
 */
router.get('/:id/standings', optionalAuthenticate, getUserValidation, validateRequest, TournamentController.getTournamentStandings);

/**
 * @swagger
 * /tournaments/{id}:
 *   put:
 *     summary: Update tournament details (creator only)
 *     tags: [Tournaments]
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
 *                 example: Updated Tournament Name
 *               description:
 *                 type: string
 *                 example: Updated tournament description
 *               maxParticipants:
 *                 type: number
 *                 example: 64
 *               entryFee:
 *                 type: number
 *                 example: 30.00
 *     responses:
 *       200:
 *         description: Tournament updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not the tournament creator
 *       404:
 *         description: Tournament not found
 */
router.put('/:id', authenticate, getUserValidation, validateRequest, TournamentController.updateTournament);

/**
 * @swagger
 * /tournaments/{id}:
 *   delete:
 *     summary: Delete tournament (creator only)
 *     tags: [Tournaments]
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not the tournament creator
 *       404:
 *         description: Tournament not found
 */
router.delete('/:id', authenticate, getUserValidation, validateRequest, TournamentController.deleteTournament);

/**
 * @swagger
 * /tournaments/user/{userId}:
 *   get:
 *     summary: Get user's tournaments
 *     tags: [Tournaments]
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
 *           enum: [upcoming, ongoing, completed, cancelled]
 *         description: Filter by tournament status
 *     responses:
 *       200:
 *         description: User tournaments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', optionalAuthenticate, getUserValidation, validateRequest, TournamentController.getUserTournaments);

export default router;