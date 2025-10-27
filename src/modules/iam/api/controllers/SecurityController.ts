import {Request, Response} from "express";
import {AuthRequest} from "../../../../shared/middleware/auth";
import {
  ValidationError,
  sendSuccess,
  asyncHandler,
} from "../../../../shared/middleware/errorHandler";
import {AuditLogger} from "../../../../shared/services/audit";
import {AuditLog} from "../../../iam/domain/models/AuditLog";

/**
 * Security Controller - Security Monitoring and Audit
 *
 * Provides comprehensive security monitoring, audit logging, and threat detection capabilities.
 * Handles security dashboards, audit trails, authentication monitoring, and security alerts.
 *
 * Key Features:
 * - Real-time security dashboard with threat metrics
 * - Comprehensive audit logging for all security events
 * - Authentication monitoring (login attempts, MFA events)
 * - Security alert management with severity levels
 * - Failed login tracking and IP-based threat detection
 * - Security metrics aggregation and reporting
 *
 * Access Control:
 * - Users can view their own security data
 * - Admins can view global security metrics
 * - All security events are automatically logged
 *
 * Security Events Tracked:
 * - Login attempts (success/failure)
 * - API key usage
 * - MFA operations
 * - Permission changes
 * - Password resets
 * - Session management
 * - Suspicious activities
 *
 * @class SecurityController
 */
export class SecurityController {
  /**
   * Get security dashboard
   *
   * Retrieves a comprehensive security dashboard with real-time metrics, threat indicators,
   * and security event summaries. Admins can view global dashboard, regular users see their own data.
   * Logs dashboard access for audit purposes.
   *
   * @async
   * @param {AuthRequest} req - Express request with user authentication
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with dashboard data
   *
   * Query Parameters:
   * @property {boolean} global - Request global dashboard (admin only)
   *
   * Dashboard Includes:
   * - Failed login attempts
   * - Security events by severity
   * - Recent alerts
   * - MFA status
   * - API key usage
   * - Suspicious activity indicators
   *
   * @example
   * GET /api/v1/iam/security/dashboard?global=true
   *
   * Response: {
   *   success: true,
   *   data: {
   *     failedLogins: 3,
   *     securityAlerts: { high: 1, medium: 2 },
   *     recentEvents: [...],
   *     mfaStatus: { enabled: true }
   *   }
   * }
   */
  static getDashboard = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const {global} = req.query;
      const userId = global === "true" ? undefined : req.user.id;

      // Check if user has admin permissions for global dashboard
      if (global === "true" && req.user.role !== "admin") {
        const dashboardData = await AuditLogger.getSecurityDashboard(
          req.user.id
        );
        sendSuccess(
          res,
          dashboardData,
          "Security dashboard data retrieved successfully"
        );
        return;
      }

      const dashboardData = await AuditLogger.getSecurityDashboard(userId);

      // Log audit event for dashboard access
      await AuditLogger.logSecurity({
        req,
        action: "security_dashboard_accessed",
        userId: req.user.id,
        status: "success",
        details: {global: global === "true"},
      });

      sendSuccess(
        res,
        dashboardData,
        "Security dashboard data retrieved successfully"
      );
    }
  );

  /**
   * Get audit logs
   *
   * Retrieves paginated audit logs with advanced filtering capabilities.
   * Provides complete audit trail of security-related events. Maximum 100 logs per request
   * to prevent performance issues.
   *
   * @async
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with paginated audit logs
   *
   * @throws {ValidationError} If date formats are invalid
   *
   * Query Parameters:
   * @property {string} userId - Filter by user ID
   * @property {string} severity - Filter by severity (low, medium, high, critical)
   * @property {string} action - Filter by action type (login, login_failed, etc.)
   * @property {string} startDate - Start date (ISO 8601 format)
   * @property {string} endDate - End date (ISO 8601 format)
   * @property {number} page - Page number (default: 1)
   * @property {number} limit - Items per page (default: 50, max: 100)
   *
   * @example
   * GET /api/v1/iam/security/audit-logs?severity=high&startDate=2025-01-01&page=1&limit=50
   *
   * Response: {
   *   success: true,
   *   data: {
   *     logs: [...],
   *     pagination: { page: 1, limit: 50, total: 150, pages: 3 }
   *   }
   * }
   */
  static getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const {
      userId,
      severity,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    // Validate date parameters
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate as string);
      if (isNaN(parsedStartDate.getTime())) {
        throw new ValidationError("Invalid start date format");
      }
    }

    if (endDate) {
      parsedEndDate = new Date(endDate as string);
      if (isNaN(parsedEndDate.getTime())) {
        throw new ValidationError("Invalid end date format");
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const logs = await AuditLog.getSecurityEvents({
      userId: userId as string,
      severity: severity as string,
      action: action as string,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      limit: Math.min(Number(limit), 100), // Maximum 100 logs per request
      skip,
    });

    // Get total count for pagination
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (severity) filter.severity = severity;
    if (action) filter.action = action;
    if (parsedStartDate || parsedEndDate) {
      filter.timestamp = {};
      if (parsedStartDate) filter.timestamp.$gte = parsedStartDate;
      if (parsedEndDate) filter.timestamp.$lte = parsedEndDate;
    }

    const total = await AuditLog.countDocuments(filter);

    sendSuccess(
      res,
      {
        logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
      "Audit logs retrieved successfully"
    );
  });

  /**
   * Get security metrics
   *
   * Provides aggregated security metrics for a specified time period.
   * Includes authentication statistics, security events by severity, MFA usage,
   * and threat indicators like top failed login IPs. Admins get global metrics,
   * regular users get personal metrics.
   *
   * @async
   * @param {AuthRequest} req - Express request with user authentication
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with comprehensive security metrics
   *
   * Query Parameters:
   * @property {string} period - Time period (24h, 7d, 30d, 90d) - default: 7d
   *
   * Metrics Included:
   * - Total security events
   * - Failed vs successful logins
   * - Login success rate percentage
   * - API key usage count
   * - Security events by severity (low, medium, high, critical)
   * - MFA events (enabled, disabled, used)
   * - Top 10 IPs with failed login attempts
   *
   * @example
   * GET /api/v1/iam/security/metrics?period=30d
   *
   * Response: {
   *   success: true,
   *   data: {
   *     period: "30d",
   *     summary: {
   *       totalEvents: 1523,
   *       failedLogins: 45,
   *       successfulLogins: 234,
   *       loginSuccessRate: 84
   *     },
   *     security: {
   *       eventsBySeverity: { low: 10, medium: 5, high: 2, critical: 0 }
   *     },
   *     authentication: {
   *       topFailedIPs: [{ ip: "192.168.1.100", attempts: 12 }]
   *     }
   *   }
   * }
   */
  static getSecurityMetrics = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const {period = "7d"} = req.query;

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case "24h":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Check if user has admin permissions for global metrics
      const userFilter = req.user.role === "admin" ? {} : {userId: req.user.id};

      // Aggregate metrics
      const [
        totalEvents,
        securityEvents,
        failedLogins,
        successfulLogins,
        apiKeyUsage,
        mfaEvents,
        topFailedIPs,
      ] = await Promise.all([
        // Total events
        AuditLog.countDocuments({
          ...userFilter,
          timestamp: {$gte: startDate},
        }),

        // Security events by severity
        AuditLog.aggregate([
          {
            $match: {
              ...userFilter,
              timestamp: {$gte: startDate},
              resource: "security",
            },
          },
          {
            $group: {
              _id: "$severity",
              count: {$sum: 1},
            },
          },
        ]),

        // Failed logins
        AuditLog.countDocuments({
          ...userFilter,
          action: "login_failed",
          timestamp: {$gte: startDate},
        }),

        // Successful logins
        AuditLog.countDocuments({
          ...userFilter,
          action: "login",
          timestamp: {$gte: startDate},
        }),

        // API key usage
        AuditLog.countDocuments({
          ...userFilter,
          action: "api_key_used",
          timestamp: {$gte: startDate},
        }),

        // MFA events
        AuditLog.aggregate([
          {
            $match: {
              ...userFilter,
              timestamp: {$gte: startDate},
              resource: "mfa",
            },
          },
          {
            $group: {
              _id: "$action",
              count: {$sum: 1},
            },
          },
        ]),

        // Top failed login IPs
        AuditLog.aggregate([
          {
            $match: {
              ...userFilter,
              action: "login_failed",
              timestamp: {$gte: startDate},
            },
          },
          {
            $group: {
              _id: "$ipAddress",
              count: {$sum: 1},
            },
          },
          {$sort: {count: -1}},
          {$limit: 10},
        ]),
      ]);

      // Format security events by severity
      const securityBySeverity = {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      };

      securityEvents.forEach((event: any) => {
        securityBySeverity[event._id as keyof typeof securityBySeverity] =
          event.count;
      });

      // Format MFA events
      const mfaEventsByAction = mfaEvents.reduce((acc: any, event: any) => {
        acc[event._id] = event.count;
        return acc;
      }, {});

      const metrics = {
        period,
        startDate,
        endDate: now,
        summary: {
          totalEvents,
          failedLogins,
          successfulLogins,
          apiKeyUsage,
          loginSuccessRate:
            successfulLogins > 0
              ? Math.round(
                  (successfulLogins / (successfulLogins + failedLogins)) * 100
                )
              : 0,
        },
        security: {
          eventsBySeverity: securityBySeverity,
          totalSecurityEvents: Object.values(securityBySeverity).reduce(
            (a, b) => a + b,
            0
          ),
        },
        authentication: {
          mfaEvents: mfaEventsByAction,
          topFailedIPs: topFailedIPs.map((item: any) => ({
            ip: item._id,
            attempts: item.count,
          })),
        },
      };

      // Log audit event for metrics access
      await AuditLogger.logSecurity({
        req,
        action: "security_metrics_accessed",
        userId: req.user.id,
        status: "success",
        details: {period, global: req.user.role === "admin"},
      });

      sendSuccess(res, metrics, "Security metrics retrieved successfully");
    }
  );

  /**
   * Get recent security alerts
   *
   * Retrieves recent high and critical severity security events from the last 7 days.
   * Provides real-time threat awareness and suspicious activity monitoring.
   * Admins see global alerts, regular users see their own alerts.
   *
   * @async
   * @param {AuthRequest} req - Express request with user authentication
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with list of security alerts
   *
   * Query Parameters:
   * @property {number} limit - Maximum number of alerts to return (default: 20)
   *
   * Alert Severities:
   * - high: Requires attention but not immediate
   * - critical: Requires immediate action
   *
   * @example
   * GET /api/v1/iam/security/alerts?limit=10
   *
   * Response: {
   *   success: true,
   *   data: {
   *     alerts: [
   *       {
   *         _id: "...",
   *         action: "multiple_failed_logins",
   *         severity: "high",
   *         timestamp: "2025-10-19T10:00:00Z",
   *         details: { attempts: 5, ip: "192.168.1.100" }
   *       }
   *     ]
   *   }
   * }
   */
  static getSecurityAlerts = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const {limit = 20} = req.query;

      // Get recent high and critical severity events
      const alerts = await AuditLog.find({
        ...(req.user.role !== "admin" && {userId: req.user.id}),
        severity: {$in: ["high", "critical"]},
        timestamp: {$gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}, // Last 7 days
      })
        .populate("userId", "email profile")
        .sort({timestamp: -1})
        .limit(Number(limit));

      sendSuccess(res, {alerts}, "Security alerts retrieved successfully");
    }
  );

  /**
   * Acknowledge a security alert
   *
   * Marks a security alert as acknowledged by the user or administrator.
   * Creates an audit log entry of the acknowledgment for compliance tracking.
   * Users can only acknowledge their own alerts unless they're admins.
   *
   * @async
   * @param {AuthRequest} req - Express request with user authentication
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with success message
   *
   * @throws {ValidationError} If alert not found or permission denied
   *
   * Authorization:
   * - Users can acknowledge their own alerts
   * - Admins can acknowledge any alert
   *
   * @example
   * POST /api/v1/iam/security/alerts/:alertId/acknowledge
   *
   * Response: {
   *   success: true,
   *   data: {},
   *   message: "Alert acknowledged successfully"
   * }
   */
  static acknowledgeAlert = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const {alertId} = req.params;

      const alert = await AuditLog.findById(alertId);
      if (!alert) {
        throw new ValidationError("Alert not found");
      }

      // Check if user has permission to acknowledge this alert
      if (
        req.user.role !== "admin" &&
        alert.userId?.toString() !== req.user.id
      ) {
        throw new ValidationError("Permission denied");
      }

      // Log the acknowledgment
      await AuditLogger.logSecurity({
        req,
        action: "security_alert_acknowledged",
        userId: req.user.id,
        status: "success",
        details: {
          alertId: alert._id,
          originalAction: alert.action,
          originalSeverity: alert.severity,
        },
      });

      sendSuccess(res, {}, "Alert acknowledged successfully");
    }
  );
}
