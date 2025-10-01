import { AuditLog } from '../models/AuditLog';
import { Request } from 'express';
import logger from './logger';

export class AuditLogger {
  /**
   * Log authentication events
   */
  static async logAuth(params: {
    req: Request;
    action: string;
    userId?: string;
    status?: 'success' | 'failure' | 'warning';
    details?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await AuditLog.logAction({
        userId: params.userId,
        action: params.action,
        resource: 'auth',
        details: params.details,
        ipAddress: params.req.ip || 'unknown',
        userAgent: params.req.get('User-Agent'),
        status: params.status || 'success',
        severity: this.getSeverityForAction(params.action, params.status),
        sessionId: params.req.sessionID
      });
    } catch (error) {
      logger.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log API key events
   */
  static async logApiKey(params: {
    req: Request;
    action: string;
    userId?: string;
    apiKeyId?: string;
    status?: 'success' | 'failure' | 'warning';
    details?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await AuditLog.logAction({
        userId: params.userId,
        action: params.action,
        resource: 'api_key',
        resourceId: params.apiKeyId,
        details: params.details,
        ipAddress: params.req.ip || 'unknown',
        userAgent: params.req.get('User-Agent'),
        status: params.status || 'success',
        severity: this.getSeverityForAction(params.action, params.status),
        apiKeyId: params.apiKeyId
      });
    } catch (error) {
      logger.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log security events
   */
  static async logSecurity(params: {
    req: Request;
    action: string;
    userId?: string;
    status?: 'success' | 'failure' | 'warning';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    details?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await AuditLog.logAction({
        userId: params.userId,
        action: params.action,
        resource: 'security',
        details: params.details,
        ipAddress: params.req.ip || 'unknown',
        userAgent: params.req.get('User-Agent'),
        status: params.status || 'success',
        severity: params.severity || this.getSeverityForAction(params.action, params.status),
        sessionId: params.req.sessionID
      });
    } catch (error) {
      logger.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log MFA events
   */
  static async logMFA(params: {
    req: Request;
    action: string;
    userId?: string;
    status?: 'success' | 'failure' | 'warning';
    details?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await AuditLog.logAction({
        userId: params.userId,
        action: params.action,
        resource: 'mfa',
        details: params.details,
        ipAddress: params.req.ip || 'unknown',
        userAgent: params.req.get('User-Agent'),
        status: params.status || 'success',
        severity: this.getSeverityForAction(params.action, params.status),
        sessionId: params.req.sessionID
      });
    } catch (error) {
      logger.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log OAuth events
   */
  static async logOAuth(params: {
    req: Request;
    action: string;
    userId?: string;
    status?: 'success' | 'failure' | 'warning';
    details?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await AuditLog.logAction({
        userId: params.userId,
        action: params.action,
        resource: 'oauth',
        details: params.details,
        ipAddress: params.req.ip || 'unknown',
        userAgent: params.req.get('User-Agent'),
        status: params.status || 'success',
        severity: this.getSeverityForAction(params.action, params.status),
        sessionId: params.req.sessionID
      });
    } catch (error) {
      logger.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log general user actions
   */
  static async logUser(params: {
    req: Request;
    action: string;
    userId?: string;
    resourceId?: string;
    status?: 'success' | 'failure' | 'warning';
    details?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await AuditLog.logAction({
        userId: params.userId,
        action: params.action,
        resource: 'user',
        resourceId: params.resourceId,
        details: params.details,
        ipAddress: params.req.ip || 'unknown',
        userAgent: params.req.get('User-Agent'),
        status: params.status || 'success',
        severity: this.getSeverityForAction(params.action, params.status),
        sessionId: params.req.sessionID
      });
    } catch (error) {
      logger.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log admin actions
   */
  static async logAdmin(params: {
    req: Request;
    action: string;
    userId?: string;
    targetUserId?: string;
    status?: 'success' | 'failure' | 'warning';
    details?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await AuditLog.logAction({
        userId: params.userId,
        action: params.action,
        resource: 'admin',
        resourceId: params.targetUserId,
        details: params.details,
        ipAddress: params.req.ip || 'unknown',
        userAgent: params.req.get('User-Agent'),
        status: params.status || 'success',
        severity: 'high', // Admin actions are always high severity
        sessionId: params.req.sessionID
      });
    } catch (error) {
      logger.error('Failed to log audit event:', error);
    }
  }

  /**
   * Determine severity based on action and status
   */
  private static getSeverityForAction(
    action: string, 
    status?: 'success' | 'failure' | 'warning'
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical actions
    const criticalActions = [
      'account_locked', 'suspicious_activity', 'ip_restriction_violation',
      'data_export_requested', 'account_deleted'
    ];
    
    // High severity actions
    const highSeverityActions = [
      'login_failed', 'mfa_disabled', 'password_reset_requested',
      'api_key_rate_limited', 'security_settings_updated'
    ];
    
    // Medium severity actions
    const mediumSeverityActions = [
      'login', 'logout', 'mfa_enabled', 'oauth_login',
      'api_key_created', 'api_key_deleted'
    ];

    if (status === 'failure') {
      return criticalActions.includes(action) ? 'critical' : 'high';
    }

    if (criticalActions.includes(action)) {
      return 'critical';
    }

    if (highSeverityActions.includes(action)) {
      return 'high';
    }

    if (mediumSeverityActions.includes(action)) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Get security dashboard data
   */
  static async getSecurityDashboard(userId?: string): Promise<{
    recentEvents: any[];
    statistics: {
      totalEvents: number;
      criticalEvents: number;
      failedLogins: number;
      recentActivity: number;
    };
    trends: {
      dailyEvents: Array<{ date: string; count: number }>;
      topActions: Array<{ action: string; count: number }>;
      ipAddresses: Array<{ ip: string; count: number }>;
    };
  }> {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Recent events (last 50)
      const recentEvents = await AuditLog.getSecurityEvents({
        userId,
        startDate: last7Days,
        limit: 50
      });

      // Statistics
      const [totalEvents, criticalEvents, failedLogins, recentActivity] = await Promise.all([
        AuditLog.countDocuments(userId ? { userId } : {}),
        AuditLog.countDocuments({
          ...(userId && { userId }),
          severity: 'critical',
          timestamp: { $gte: last30Days }
        }),
        AuditLog.countDocuments({
          ...(userId && { userId }),
          action: 'login_failed',
          timestamp: { $gte: last7Days }
        }),
        AuditLog.countDocuments({
          ...(userId && { userId }),
          timestamp: { $gte: last24Hours }
        })
      ]);

      // Trends - Daily events for last 7 days
      const dailyEventsAgg = await AuditLog.aggregate([
        {
          $match: {
            ...(userId && { userId }),
            timestamp: { $gte: last7Days }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Top actions
      const topActionsAgg = await AuditLog.aggregate([
        {
          $match: {
            ...(userId && { userId }),
            timestamp: { $gte: last7Days }
          }
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      // Top IP addresses
      const topIPsAgg = await AuditLog.aggregate([
        {
          $match: {
            ...(userId && { userId }),
            timestamp: { $gte: last7Days }
          }
        },
        {
          $group: {
            _id: '$ipAddress',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      return {
        recentEvents,
        statistics: {
          totalEvents,
          criticalEvents,
          failedLogins,
          recentActivity
        },
        trends: {
          dailyEvents: dailyEventsAgg.map(item => ({
            date: item._id,
            count: item.count
          })),
          topActions: topActionsAgg.map(item => ({
            action: item._id,
            count: item.count
          })),
          ipAddresses: topIPsAgg.map(item => ({
            ip: item._id,
            count: item.count
          }))
        }
      };
    } catch (error) {
      logger.error('Failed to get security dashboard data:', error);
      throw error;
    }
  }
}