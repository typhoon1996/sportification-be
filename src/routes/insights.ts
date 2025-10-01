import { Router } from 'express';
import { InsightsController } from '../controllers/InsightsController';
import { authenticate, authorize } from '../middleware/auth';
import { authLimiter } from '../middleware/security';

const router = Router();

// Apply rate limiting
router.use(authLimiter);

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /insights/application:
 *   get:
 *     summary: Get comprehensive application insights
 *     tags: [Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Application insights retrieved successfully
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
 *                     summary:
 *                       type: object
 *                     userInsights:
 *                       type: object
 *                     activityInsights:
 *                       type: object
 *                     contentInsights:
 *                       type: object
 *                     engagementInsights:
 *                       type: object
 *                     performanceInsights:
 *                       type: object
 *                     securityInsights:
 *                       type: object
 *                     recommendations:
 *                       type: array
 *       401:
 *         description: Unauthorized
 */
router.get('/application', InsightsController.getApplicationInsights);

/**
 * @swagger
 * /insights/user-behavior:
 *   get:
 *     summary: Get user behavior insights
 *     tags: [Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *         description: Analysis period
 *     responses:
 *       200:
 *         description: User behavior insights retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/user-behavior', InsightsController.getUserBehaviorInsights);

/**
 * @swagger
 * /insights/business:
 *   get:
 *     summary: Get business performance insights
 *     tags: [Insights] 
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business insights retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/business', InsightsController.getBusinessInsights);

/**
 * @swagger
 * /insights/predictive:
 *   get:
 *     summary: Get predictive insights and recommendations
 *     tags: [Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Predictive insights retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/predictive', InsightsController.getPredictiveInsights);

// Admin-only routes
router.use(authorize(['admin']));

/**
 * @swagger
 * /insights/competitive:
 *   get:
 *     summary: Get competitive analysis insights (Admin only)
 *     tags: [Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Competitive insights retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/competitive', InsightsController.getCompetitiveInsights);

export default router;