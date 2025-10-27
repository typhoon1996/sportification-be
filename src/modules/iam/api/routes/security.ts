import {Router} from "express";
import {query, param} from "express-validator";
import {authenticate} from "../../../../shared/middleware/auth";
import {authLimiter} from "../../../../shared/middleware/security";
import {validateRequest} from "../../../../shared/middleware/validation";
import {SecurityController} from "../controllers/SecurityController";

const router = Router();

// Apply auth limiter to security routes
router.use(authLimiter);

// All routes require authentication
router.use(authenticate);

// Validation middleware
const auditLogsValidation = [
  query("page")
    .optional()
    .isInt({min: 1})
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({min: 1, max: 100})
    .withMessage("Limit must be between 1 and 100"),
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
  query("severity")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Severity must be one of: low, medium, high, critical"),
  query("userId")
    .optional()
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

const metricsValidation = [
  query("period")
    .optional()
    .isIn(["24h", "7d", "30d", "90d"])
    .withMessage("Period must be one of: 24h, 7d, 30d, 90d"),
];

/**
 * @swagger
 * /security/dashboard:
 *   get:
 *     summary: Get security dashboard data
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: global
 *         schema:
 *           type: boolean
 *         description: Get global dashboard data (admin only)
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
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
 *                     recentEvents:
 *                       type: array
 *                     statistics:
 *                       type: object
 *                     trends:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */
router.get("/dashboard", SecurityController.getDashboard);

/**
 * @swagger
 * /security/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
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
 *         description: Items per page
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by severity
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date filter
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/audit-logs",
  auditLogsValidation,
  validateRequest,
  SecurityController.getAuditLogs
);

/**
 * @swagger
 * /security/metrics:
 *   get:
 *     summary: Get security metrics
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d, 90d]
 *         description: Time period for metrics
 *     responses:
 *       200:
 *         description: Security metrics retrieved successfully
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
 *                     security:
 *                       type: object
 *                     authentication:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/metrics",
  metricsValidation,
  validateRequest,
  SecurityController.getSecurityMetrics
);

/**
 * @swagger
 * /security/alerts:
 *   get:
 *     summary: Get recent security alerts
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Number of alerts to retrieve
 *     responses:
 *       200:
 *         description: Security alerts retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/alerts",
  [
    query("limit")
      .optional()
      .isInt({min: 1, max: 50})
      .withMessage("Limit must be between 1 and 50"),
  ],
  validateRequest,
  SecurityController.getSecurityAlerts
);

/**
 * @swagger
 * /security/alerts/{alertId}/acknowledge:
 *   post:
 *     summary: Acknowledge a security alert
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert ID
 *     responses:
 *       200:
 *         description: Alert acknowledged successfully
 *       404:
 *         description: Alert not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/alerts/:alertId/acknowledge",
  [param("alertId").isMongoId().withMessage("Invalid alert ID")],
  validateRequest,
  SecurityController.acknowledgeAlert
);

export default router;
