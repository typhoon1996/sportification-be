import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, query } from 'express-validator';
import { authLimiter } from '../middleware/security';

const router = Router();

// Apply rate limiting
router.use(authLimiter);

// All routes require authentication
router.use(authenticate);

// Validation middleware
const dateRangeValidation = [
  query('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];

const customReportValidation = [
  body('reportType')
    .isIn(['user_retention', 'feature_adoption', 'performance_summary', 'revenue_analysis'])
    .withMessage('Invalid report type'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get comprehensive analytics dashboard
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *         description: Timeframe for insights
 *     responses:
 *       200:
 *         description: Analytics dashboard retrieved successfully
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
 *                     dashboard:
 *                       type: object
 *                       properties:
 *                         activeUsers:
 *                           type: number
 *                         requestsPerMinute:
 *                           type: array
 *                         avgResponseTime:
 *                           type: number
 *                         errorRate:
 *                           type: number
 *                         systemHealth:
 *                           type: array
 *                         topEndpoints:
 *                           type: array
 *                         userActivities:
 *                           type: array
 *                         deviceBreakdown:
 *                           type: array
 *                     insights:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard', AnalyticsController.getAnalyticsDashboard);

/**
 * @swagger
 * /analytics/user-engagement:
 *   get:
 *     summary: Get user engagement analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for analytics
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Specific user ID to analyze
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *         description: Grouping interval
 *     responses:
 *       200:
 *         description: User engagement analytics retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/user-engagement', dateRangeValidation, validateRequest, AnalyticsController.getUserEngagementAnalytics);

/**
 * @swagger
 * /analytics/performance:
 *   get:
 *     summary: Get performance analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for analytics
 *       - in: query
 *         name: endpoint
 *         schema:
 *           type: string
 *         description: Specific endpoint to analyze
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [response_time, error_rate, throughput]
 *         description: Specific metric to focus on
 *     responses:
 *       200:
 *         description: Performance analytics retrieved successfully
 *       400:
 *         description: Invalid parameters
 */
router.get('/performance', dateRangeValidation, validateRequest, AnalyticsController.getPerformanceAnalytics);

/**
 * @swagger
 * /analytics/business-intelligence:
 *   get:
 *     summary: Get business intelligence metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for metrics
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for metrics
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [user_engagement, performance, revenue, security, content]
 *         description: Metric category to filter by
 *       - in: query
 *         name: aggregation
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *         description: Aggregation level
 *     responses:
 *       200:
 *         description: Business intelligence retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/business-intelligence', dateRangeValidation, validateRequest, AnalyticsController.getBusinessIntelligence);

/**
 * @swagger
 * /analytics/system-health:
 *   get:
 *     summary: Get system health monitoring data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: component
 *         schema:
 *           type: string
 *           enum: [api, database, cache, external_service, queue]
 *         description: Specific component to monitor
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d]
 *         description: Timeframe for monitoring data
 *     responses:
 *       200:
 *         description: System health monitoring retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/system-health', AnalyticsController.getSystemHealthMonitoring);

/**
 * @swagger
 * /analytics/predictive:
 *   get:
 *     summary: Get predictive analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *         description: Metric to predict
 *       - in: query
 *         name: horizon
 *         schema:
 *           type: string
 *           enum: [1d, 7d, 30d]
 *         description: Prediction horizon
 *     responses:
 *       200:
 *         description: Predictive analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/predictive', AnalyticsController.getPredictiveAnalytics);

/**
 * @swagger
 * /analytics/reports/custom:
 *   post:
 *     summary: Generate custom analytics report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportType
 *               - startDate
 *               - endDate
 *             properties:
 *               reportType:
 *                 type: string
 *                 enum: [user_retention, feature_adoption, performance_summary, revenue_analysis]
 *                 description: Type of report to generate
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Start date for report
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: End date for report
 *               dimensions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Dimensions to group by
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Metrics to include
 *               filters:
 *                 type: object
 *                 description: Filters to apply
 *     responses:
 *       200:
 *         description: Custom report generated successfully
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
 *                     reportType:
 *                       type: string
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                     period:
 *                       type: object
 *                     data:
 *                       type: array
 *                     metadata:
 *                       type: object
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.post('/reports/custom', customReportValidation, validateRequest, AnalyticsController.getCustomReports);

// Admin-only routes for advanced analytics
router.use(authorize(['admin']));

/**
 * @swagger
 * /analytics/admin/insights:
 *   get:
 *     summary: Get advanced admin insights (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deep
 *         schema:
 *           type: boolean
 *         description: Include deep analytics
 *     responses:
 *       200:
 *         description: Admin insights retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/admin/insights', async (req, res) => {
  // Advanced admin-only analytics
  const insights = {
    systemOverview: {
      totalUsers: await require('../models/User').User.countDocuments(),
      totalMatches: await require('../models/Match').Match.countDocuments(),
      totalTournaments: await require('../models/Tournament').Tournament.countDocuments(),
      systemUptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    },
    securityMetrics: {
      // Security-related metrics would go here
    },
    performanceProfile: {
      // Detailed performance profiling
    }
  };

  res.json({
    success: true,
    data: insights,
    message: 'Admin insights retrieved successfully'
  });
});

export default router;