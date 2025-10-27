/**
 * Analytics Routes Module
 *
 * Base Path: /api/v1/analytics
 *
 * Provides analytics and business intelligence endpoints.
 * Delivers metrics, statistics, and insights for users and administrators.
 *
 * Analytics Categories:
 * - Overview analytics (general statistics)
 * - User analytics (activity, performance, engagement)
 * - Match analytics (participation, wins/losses)
 * - Tournament analytics (performance, rankings)
 * - Team analytics (member activity, achievements)
 * - System analytics (platform usage, growth metrics)
 *
 * Features:
 * - Real-time dashboard data
 * - User-specific performance metrics
 * - Aggregated system statistics
 * - Time-based filtering (daily, weekly, monthly)
 * - Export capabilities
 *
 * Security:
 * - All routes require authentication
 * - Users can view their own analytics
 * - Admin-only routes for system-wide metrics
 * - Role-based access to sensitive data
 */

import {Router} from "express";
import {analyticsController} from "../controllers/SimpleAnalyticsController";
import {authenticate} from "../../../../shared/middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/v1/analytics/overview:
 *   get:
 *     summary: Get analytics overview
 *     description: Retrieve general analytics overview for the authenticated user
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics overview retrieved successfully
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
 *                     totalMatches:
 *                       type: integer
 *                     totalTeams:
 *                       type: integer
 *                     totalTournaments:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/overview", authenticate, analyticsController.getOverviewAnalytics);

/**
 * @swagger
 * /api/v1/analytics/users/{userId}:
 *   get:
 *     summary: Get user analytics
 *     description: Retrieve analytics for a specific user (or current user if no ID provided)
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: false
 *         schema:
 *           type: string
 *         description: User ID (optional, defaults to authenticated user)
 *     responses:
 *       200:
 *         description: User analytics retrieved successfully
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
 *                     matchesPlayed:
 *                       type: integer
 *                     matchesWon:
 *                       type: integer
 *                     winRate:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/users/:userId?",
  authenticate,
  analyticsController.getUserAnalytics
);

/**
 * @swagger
 * /api/v1/analytics/matches/{matchId}:
 *   get:
 *     summary: Get match analytics
 *     description: Retrieve analytics for a specific match
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Match analytics retrieved successfully
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
 *                     participants:
 *                       type: integer
 *                     duration:
 *                       type: number
 *                     score:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/matches/:matchId",
  authenticate,
  analyticsController.getMatchAnalytics
);

/**
 * @swagger
 * /api/v1/analytics/insights:
 *   get:
 *     summary: Get analytics insights
 *     description: Retrieve personalized insights and recommendations for the user
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Insights retrieved successfully
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
 *                     insights:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           message:
 *                             type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/insights", authenticate, analyticsController.getInsights);

export default router;
