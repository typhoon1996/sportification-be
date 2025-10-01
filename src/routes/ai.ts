import { Router } from 'express';
import { AIController } from '../controllers/AIController';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { param, query, body } from 'express-validator';
import { authLimiter } from '../middleware/security';

const router = Router();

// Apply rate limiting
router.use(authLimiter);

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /ai/match/{matchId}/predict:
 *   get:
 *     summary: Get AI-powered match outcome prediction
 *     tags: [AI & Machine Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID to predict
 *     responses:
 *       200:
 *         description: Match prediction generated successfully
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
 *                     matchId:
 *                       type: string
 *                     predictions:
 *                       type: object
 *                     factors:
 *                       type: object
 *                     recommendation:
 *                       type: string
 *       404:
 *         description: Match not found
 *       401:
 *         description: Unauthorized
 */
router.get('/match/:matchId/predict', [
  param('matchId').isMongoId().withMessage('Invalid match ID')
], validateRequest, AIController.predictMatchOutcome);

/**
 * @swagger
 * /ai/recommendations/matches:
 *   get:
 *     summary: Get personalized match recommendations
 *     tags: [AI & Machine Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: "Number of recommendations (default: 10)"
 *       - in: query
 *         name: includeReasons
 *         schema:
 *           type: boolean
 *         description: "Include reasons for recommendations"
 *     responses:
 *       200:
 *         description: Match recommendations generated successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/recommendations/matches', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('includeReasons').optional().isBoolean().withMessage('includeReasons must be boolean')
], validateRequest, AIController.getMatchRecommendations);

/**
 * @swagger
 * /ai/churn-analysis:
 *   get:
 *     summary: Analyze user churn risk
 *     tags: [AI & Machine Learning]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Churn analysis completed successfully
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
 *                     churnRisk:
 *                       type: number
 *                     riskLevel:
 *                       type: string
 *                       enum: [low, medium, high]
 *                     factors:
 *                       type: object
 *                     recommendations:
 *                       type: array
 *                     actionPlan:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/churn-analysis', AIController.analyzeChurnRisk);

/**
 * @swagger
 * /ai/churn-analysis/{userId}:
 *   get:
 *     summary: Analyze specific user's churn risk (Admin only)
 *     tags: [AI & Machine Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to analyze
 *     responses:
 *       200:
 *         description: Churn analysis completed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/churn-analysis/:userId', [
  param('userId').isMongoId().withMessage('Invalid user ID')
], validateRequest, authorize(['admin']), AIController.analyzeChurnRisk);

/**
 * @swagger
 * /ai/tournament/{tournamentId}/bracket:
 *   post:
 *     summary: Generate optimal tournament bracket using AI
 *     tags: [AI & Machine Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               algorithm:
 *                 type: string
 *                 enum: [balanced, random, seeded]
 *                 default: balanced
 *     responses:
 *       200:
 *         description: Tournament bracket generated successfully
 *       404:
 *         description: Tournament not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to modify this tournament
 */
router.post('/tournament/:tournamentId/bracket', [
  param('tournamentId').isMongoId().withMessage('Invalid tournament ID'),
  body('algorithm').optional().isIn(['balanced', 'random', 'seeded']).withMessage('Invalid algorithm')
], validateRequest, AIController.generateTournamentBracket);

/**
 * @swagger
 * /ai/optimal-times:
 *   get:
 *     summary: Predict optimal match times for user
 *     tags: [AI & Machine Learning]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Optimal times predicted successfully
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
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           day:
 *                             type: string
 *                           timeSlot:
 *                             type: string
 *                           score:
 *                             type: number
 *                           confidence:
 *                             type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/optimal-times', AIController.predictOptimalMatchTimes);

/**
 * @swagger
 * /ai/optimal-times/{userId}:
 *   get:
 *     summary: Predict optimal match times for specific user (Admin only)
 *     tags: [AI & Machine Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Optimal times predicted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/optimal-times/:userId', [
  param('userId').isMongoId().withMessage('Invalid user ID')
], validateRequest, authorize(['admin']), AIController.predictOptimalMatchTimes);

/**
 * @swagger
 * /ai/sports-insights:
 *   get:
 *     summary: Get AI-powered sports insights dashboard
 *     tags: [AI & Machine Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *         description: Timeframe for insights
 *     responses:
 *       200:
 *         description: Sports insights generated successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/sports-insights', [
  query('timeframe').optional().isIn(['7d', '30d', '90d']).withMessage('Invalid timeframe')
], validateRequest, AIController.getAISportsInsights);

/**
 * @swagger
 * /ai/performance-predictions:
 *   get:
 *     summary: Get performance predictions and improvement suggestions
 *     tags: [AI & Machine Learning]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance predictions generated successfully
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
 *                     currentRating:
 *                       type: number
 *                     projectedRating:
 *                       type: object
 *                     improvementFactors:
 *                       type: array
 *                     recommendations:
 *                       type: array
 *       401:
 *         description: Unauthorized
 */
router.get('/performance-predictions', AIController.getPerformancePredictions);

/**
 * @swagger
 * /ai/opponent-analysis/{opponentId}:
 *   get:
 *     summary: Get AI-powered opponent analysis
 *     tags: [AI & Machine Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: opponentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Opponent user ID
 *     responses:
 *       200:
 *         description: Opponent analysis completed successfully
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
 *                     headToHead:
 *                       type: object
 *                     opponentProfile:
 *                       type: object
 *                     matchupAnalysis:
 *                       type: object
 *                     recommendations:
 *                       type: array
 *       404:
 *         description: Opponent not found
 *       401:
 *         description: Unauthorized
 */
router.get('/opponent-analysis/:opponentId', [
  param('opponentId').isMongoId().withMessage('Invalid opponent ID')
], validateRequest, AIController.getOpponentAnalysis);

/**
 * @swagger
 * /ai/training-recommendations:
 *   get:
 *     summary: Get AI-powered training recommendations
 *     tags: [AI & Machine Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: focus
 *         schema:
 *           type: string
 *           enum: [overall, technical, mental, physical]
 *         description: Training focus area
 *     responses:
 *       200:
 *         description: Training recommendations generated successfully
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
 *                     focus:
 *                       type: string
 *                     recommendations:
 *                       type: array
 *                     schedule:
 *                       type: object
 *                     progressTracking:
 *                       type: array
 *       401:
 *         description: Unauthorized
 */
router.get('/training-recommendations', [
  query('focus').optional().isIn(['overall', 'technical', 'mental', 'physical']).withMessage('Invalid focus area')
], validateRequest, AIController.getTrainingRecommendations);

export default router;