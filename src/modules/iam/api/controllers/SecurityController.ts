import { Request, Response } from 'express';
import { AuditLog } from '../../../iam/domain/models/AuditLog';
import { AuditLogger } from '../../../../shared/services/audit';
import { ValidationError, sendSuccess, asyncHandler } from '../../../../shared/middleware/errorHandler';
import { AuthRequest } from '../../../../shared/middleware/auth';

export class SecurityController {
  // Get security dashboard data
  static getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { global } = req.query;
    const userId = global === 'true' ? undefined : req.user.id;

    // Check if user has admin permissions for global dashboard
    if (global === 'true' && req.user.role !== 'admin') {
      const dashboardData = await AuditLogger.getSecurityDashboard(req.user.id);
      sendSuccess(res, dashboardData, 'Security dashboard data retrieved successfully');
      return;
    }

    const dashboardData = await AuditLogger.getSecurityDashboard(userId);

    // Log audit event for dashboard access
    await AuditLogger.logSecurity({
      req,
      action: 'security_dashboard_accessed',
      userId: req.user.id,
      status: 'success',
      details: { global: global === 'true' },
    });

    sendSuccess(res, dashboardData, 'Security dashboard data retrieved successfully');
  });

  // Get audit logs
  static getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const { userId, severity, action, startDate, endDate, page = 1, limit = 50 } = req.query;

    // Validate date parameters
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate as string);
      if (isNaN(parsedStartDate.getTime())) {
        throw new ValidationError('Invalid start date format');
      }
    }

    if (endDate) {
      parsedEndDate = new Date(endDate as string);
      if (isNaN(parsedEndDate.getTime())) {
        throw new ValidationError('Invalid end date format');
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
      'Audit logs retrieved successfully'
    );
  });

  // Get security metrics
  static getSecurityMetrics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { period = '7d' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Check if user has admin permissions for global metrics
    const userFilter = req.user.role === 'admin' ? {} : { userId: req.user.id };

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
        timestamp: { $gte: startDate },
      }),

      // Security events by severity
      AuditLog.aggregate([
        {
          $match: {
            ...userFilter,
            timestamp: { $gte: startDate },
            resource: 'security',
          },
        },
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 },
          },
        },
      ]),

      // Failed logins
      AuditLog.countDocuments({
        ...userFilter,
        action: 'login_failed',
        timestamp: { $gte: startDate },
      }),

      // Successful logins
      AuditLog.countDocuments({
        ...userFilter,
        action: 'login',
        timestamp: { $gte: startDate },
      }),

      // API key usage
      AuditLog.countDocuments({
        ...userFilter,
        action: 'api_key_used',
        timestamp: { $gte: startDate },
      }),

      // MFA events
      AuditLog.aggregate([
        {
          $match: {
            ...userFilter,
            timestamp: { $gte: startDate },
            resource: 'mfa',
          },
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
          },
        },
      ]),

      // Top failed login IPs
      AuditLog.aggregate([
        {
          $match: {
            ...userFilter,
            action: 'login_failed',
            timestamp: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: '$ipAddress',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
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
      securityBySeverity[event._id as keyof typeof securityBySeverity] = event.count;
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
            ? Math.round((successfulLogins / (successfulLogins + failedLogins)) * 100)
            : 0,
      },
      security: {
        eventsBySeverity: securityBySeverity,
        totalSecurityEvents: Object.values(securityBySeverity).reduce((a, b) => a + b, 0),
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
      action: 'security_metrics_accessed',
      userId: req.user.id,
      status: 'success',
      details: { period, global: req.user.role === 'admin' },
    });

    sendSuccess(res, metrics, 'Security metrics retrieved successfully');
  });

  // Get recent security alerts
  static getSecurityAlerts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { limit = 20 } = req.query;

    // Get recent high and critical severity events
    const alerts = await AuditLog.find({
      ...(req.user.role !== 'admin' && { userId: req.user.id }),
      severity: { $in: ['high', 'critical'] },
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    })
      .populate('userId', 'email profile')
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    sendSuccess(res, { alerts }, 'Security alerts retrieved successfully');
  });

  // Mark alert as acknowledged
  static acknowledgeAlert = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { alertId } = req.params;

    const alert = await AuditLog.findById(alertId);
    if (!alert) {
      throw new ValidationError('Alert not found');
    }

    // Check if user has permission to acknowledge this alert
    if (req.user.role !== 'admin' && alert.userId?.toString() !== req.user.id) {
      throw new ValidationError('Permission denied');
    }

    // Log the acknowledgment
    await AuditLogger.logSecurity({
      req,
      action: 'security_alert_acknowledged',
      userId: req.user.id,
      status: 'success',
      details: {
        alertId: alert._id,
        originalAction: alert.action,
        originalSeverity: alert.severity,
      },
    });

    sendSuccess(res, {}, 'Alert acknowledged successfully');
  });
}
