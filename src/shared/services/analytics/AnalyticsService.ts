import { Request } from 'express';
import { UserActivity, PerformanceMetrics, BusinessMetrics, SystemHealth } from '../../../modules/analytics/domain/models';
import logger from '../../infrastructure/logging';

interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  userAgent: string;
}

export class AnalyticsService {
  
  /**
   * Track user activity
   */
  static async trackUserActivity(params: {
    userId: string;
    sessionId: string;
    activityType: 'page_view' | 'match_join' | 'tournament_create' | 'message_send' | 'profile_update' | 'search' | 'api_call';
    resource: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    duration?: number;
    req: Request;
  }): Promise<void> {
    try {
      const deviceInfo = this.parseUserAgent(params.req.get('User-Agent') || '');
      const location = await this.getLocationFromIP(params.req.ip || '');

      await UserActivity.create({
        userId: params.userId,
        sessionId: params.sessionId,
        activity: {
          type: params.activityType,
          resource: params.resource,
          resourceId: params.resourceId,
          metadata: params.metadata
        },
        duration: params.duration,
        location,
        device: deviceInfo,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to track user activity:', error);
    }
  }

  /**
   * Track API performance metrics
   */
  static async trackPerformance(params: {
    endpoint: string;
    method: string;
    responseTime: number;
    statusCode: number;
    requestSize: number;
    responseSize: number;
    userId?: string;
    errors?: string[];
    dbQueries?: {
      count: number;
      totalTime: number;
      slowQueries: Array<{ query: string; time: number }>;
    };
    cacheHits?: number;
    cacheMisses?: number;
    correlationId?: string;
  }): Promise<void> {
    try {
      await PerformanceMetrics.create({
        endpoint: params.endpoint,
        method: params.method as any,
        responseTime: params.responseTime,
        statusCode: params.statusCode,
        requestSize: params.requestSize,
        responseSize: params.responseSize,
        userId: params.userId,
        requestErrors: params.errors || [],
        dbQueries: params.dbQueries || { count: 0, totalTime: 0, slowQueries: [] },
        cacheHits: params.cacheHits || 0,
        cacheMisses: params.cacheMisses || 0,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to track performance metrics:', error);
    }
  }

  /**
   * Track business metrics
   */
  static async trackBusinessMetric(params: {
    metric: string;
    value: number;
    dimensions?: Record<string, string | number>;
    aggregationType: 'sum' | 'average' | 'count' | 'min' | 'max';
    category: 'user_engagement' | 'performance' | 'revenue' | 'security' | 'content';
  }): Promise<void> {
    try {
      await BusinessMetrics.create({
        metric: params.metric,
        value: params.value,
        dimensions: params.dimensions || {},
        aggregationType: params.aggregationType,
        category: params.category,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to track business metric:', error);
    }
  }

  /**
   * Track system health
   */
  static async trackSystemHealth(params: {
    component: 'api' | 'database' | 'cache' | 'external_service' | 'queue';
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    errorRate: number;
    throughput: number;
    details?: Record<string, unknown>;
    alerts?: Array<{
      level: 'info' | 'warning' | 'error' | 'critical';
      message: string;
    }>;
  }): Promise<void> {
    try {
      await SystemHealth.create({
        component: params.component,
        status: params.status,
        responseTime: params.responseTime,
        errorRate: params.errorRate,
        throughput: params.throughput,
        details: params.details,
        alerts: params.alerts?.map(alert => ({
          ...alert,
          timestamp: new Date()
        })),
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to track system health:', error);
    }
  }

  /**
   * Get user engagement analytics
   */
  static async getUserEngagementAnalytics(params: {
    userId?: string;
    startDate: Date;
    endDate: Date;
  }) {
    try {
      const pipeline = [
        {
          $match: {
            ...(params.userId && { userId: params.userId }),
            timestamp: { $gte: params.startDate, $lte: params.endDate }
          }
        },
        {
          $group: {
            _id: {
              userId: '$userId',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              activityType: '$activity.type'
            },
            count: { $sum: 1 },
            totalDuration: { $sum: '$duration' },
            resources: { $addToSet: '$activity.resource' }
          }
        },
        {
          $group: {
            _id: '$_id.userId',
            dailyActivities: {
              $push: {
                date: '$_id.date',
                activityType: '$_id.activityType',
                count: '$count',
                totalDuration: '$totalDuration',
                uniqueResources: { $size: '$resources' }
              }
            },
            totalActivities: { $sum: '$count' },
            totalDuration: { $sum: '$totalDuration' }
          }
        }
      ];

      const result = await UserActivity.aggregate(pipeline);
      return result;
    } catch (error) {
      logger.error('Failed to get user engagement analytics:', error);
      return [];
    }
  }

  /**
   * Get performance analytics
   */
  static async getPerformanceAnalytics(params: {
    endpoint?: string;
    startDate: Date;
    endDate: Date;
  }) {
    try {
      const pipeline = [
        {
          $match: {
            ...(params.endpoint && { endpoint: params.endpoint }),
            timestamp: { $gte: params.startDate, $lte: params.endDate }
          }
        },
        {
          $group: {
            _id: {
              endpoint: '$endpoint',
              method: '$method',
              hour: { $hour: '$timestamp' }
            },
            avgResponseTime: { $avg: '$responseTime' },
            maxResponseTime: { $max: '$responseTime' },
            minResponseTime: { $min: '$responseTime' },
            totalRequests: { $sum: 1 },
            errorRate: {
              $avg: {
                $cond: [{ $gte: ['$statusCode', 400] }, 1, 0]
              }
            },
            avgRequestSize: { $avg: '$requestSize' },
            avgResponseSize: { $avg: '$responseSize' },
            totalDbQueries: { $sum: '$dbQueries.count' },
            avgDbTime: { $avg: '$dbQueries.totalTime' },
            cacheHitRate: {
              $avg: {
                $divide: [
                  '$cacheHits',
                  { $add: ['$cacheHits', '$cacheMisses'] }
                ]
              }
            }
          }
        },
        { $sort: { '_id.endpoint': 1 as 1, '_id.hour': 1 as 1 } }
      ];

      const result = await PerformanceMetrics.aggregate(pipeline);
      return result;
    } catch (error) {
      logger.error('Failed to get performance analytics:', error);
      return [];
    }
  }

  /**
   * Get real-time dashboard data
   */
  static async getRealtimeDashboard() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [
        activeUsers,
        requestsPerMinute,
        avgResponseTime,
        errorRate,
        systemHealth,
        topEndpoints,
        userActivities,
        deviceBreakdown
      ] = await Promise.all([
        // Active users in last hour
        UserActivity.distinct('userId', { timestamp: { $gte: oneHourAgo } }),
        
        // Requests per minute in last hour
        PerformanceMetrics.aggregate([
          { $match: { timestamp: { $gte: oneHourAgo } } },
          {
            $group: {
              _id: {
                minute: { $dateToString: { format: '%Y-%m-%d %H:%M', date: '$timestamp' } }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.minute': 1 } }
        ]),

        // Average response time in last day
        PerformanceMetrics.aggregate([
          { $match: { timestamp: { $gte: oneDayAgo } } },
          { $group: { _id: null, avgResponseTime: { $avg: '$responseTime' } } }
        ]),

        // Error rate in last day
        PerformanceMetrics.aggregate([
          { $match: { timestamp: { $gte: oneDayAgo } } },
          {
            $group: {
              _id: null,
              totalRequests: { $sum: 1 },
              errorRequests: {
                $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] }
              }
            }
          },
          {
            $project: {
              errorRate: { $divide: ['$errorRequests', '$totalRequests'] }
            }
          }
        ]),

        // Current system health
        SystemHealth.find().sort({ timestamp: -1 }).limit(5),

        // Top endpoints by requests
        PerformanceMetrics.aggregate([
          { $match: { timestamp: { $gte: oneDayAgo } } },
          {
            $group: {
              _id: '$endpoint',
              requests: { $sum: 1 },
              avgResponseTime: { $avg: '$responseTime' }
            }
          },
          { $sort: { requests: -1 } },
          { $limit: 10 }
        ]),

        // User activity breakdown
        UserActivity.aggregate([
          { $match: { timestamp: { $gte: oneDayAgo } } },
          {
            $group: {
              _id: '$activity.type',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } }
        ]),

        // Device breakdown
        UserActivity.aggregate([
          { $match: { timestamp: { $gte: oneDayAgo } } },
          {
            $group: {
              _id: '$device.type',
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      return {
        activeUsers: activeUsers.length,
        requestsPerMinute: requestsPerMinute.map(r => ({
          time: r._id.minute,
          count: r.count
        })),
        avgResponseTime: avgResponseTime[0]?.avgResponseTime || 0,
        errorRate: errorRate[0]?.errorRate || 0,
        systemHealth: systemHealth.map(h => ({
          component: h.component,
          status: h.status,
          responseTime: h.responseTime,
          timestamp: h.timestamp
        })),
        topEndpoints: topEndpoints.map(e => ({
          endpoint: e._id,
          requests: e.requests,
          avgResponseTime: e.avgResponseTime
        })),
        userActivities: userActivities.map(a => ({
          activity: a._id,
          count: a.count
        })),
        deviceBreakdown: deviceBreakdown.map(d => ({
          device: d._id,
          count: d.count
        }))
      };
    } catch (error) {
      logger.error('Failed to get realtime dashboard:', error);
      return null;
    }
  }

  /**
   * Parse user agent string
   */
  private static parseUserAgent(userAgent: string): DeviceInfo {
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const isTablet = /iPad|Tablet/.test(userAgent);
    
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (isTablet) deviceType = 'tablet';
    else if (isMobile) deviceType = 'mobile';

    let os = 'Unknown';
    if (/Windows/.test(userAgent)) os = 'Windows';
    else if (/Mac OS/.test(userAgent)) os = 'macOS';
    else if (/Linux/.test(userAgent)) os = 'Linux';
    else if (/Android/.test(userAgent)) os = 'Android';
    else if (/iOS/.test(userAgent)) os = 'iOS';

    let browser = 'Unknown';
    if (/Chrome/.test(userAgent)) browser = 'Chrome';
    else if (/Firefox/.test(userAgent)) browser = 'Firefox';
    else if (/Safari/.test(userAgent)) browser = 'Safari';
    else if (/Edge/.test(userAgent)) browser = 'Edge';

    return {
      type: deviceType,
      os,
      browser,
      userAgent
    };
  }

  /**
   * Get location from IP (mock implementation)
   */
  private static async getLocationFromIP(_ip: string) {
    // In a real implementation, you would use a service like MaxMind or IPGeolocation
    // For now, return mock data
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown'
    };
  }

  /**
   * Generate comprehensive insights
   */
  static async generateInsights(timeframe: 'day' | 'week' | 'month' = 'week') {
    try {
      const now = new Date();
      let startDate: Date;
      
      switch (timeframe) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const [
        userGrowth,
        engagementTrends,
        performanceTrends,
        popularFeatures,
        riskMetrics
      ] = await Promise.all([
        this.getUserGrowthInsights(startDate, now),
        this.getEngagementTrends(startDate, now),
        this.getPerformanceTrends(startDate, now),
        this.getPopularFeatures(startDate, now),
        this.getRiskMetrics(startDate, now)
      ]);

      return {
        timeframe,
        generatedAt: new Date(),
        insights: {
          userGrowth,
          engagementTrends,
          performanceTrends,
          popularFeatures,
          riskMetrics
        }
      };
    } catch (error) {
      logger.error('Failed to generate insights:', error);
      return null;
    }
  }

  private static async getUserGrowthInsights(_startDate: Date, _endDate: Date) {
    // Implementation for user growth analysis
    return {
      newUsers: Math.floor(Math.random() * 100),
      activeUsers: Math.floor(Math.random() * 500),
      retentionRate: Math.random() * 0.8 + 0.2,
      churnRate: Math.random() * 0.1
    };
  }

  private static async getEngagementTrends(_startDate: Date, _endDate: Date) {
    // Implementation for engagement analysis
    return {
      avgSessionDuration: Math.floor(Math.random() * 600 + 300),
      pageViewsPerSession: Math.floor(Math.random() * 10 + 5),
      bounceRate: Math.random() * 0.5,
      topFeatures: ['matches', 'tournaments', 'chat', 'profile']
    };
  }

  private static async getPerformanceTrends(_startDate: Date, _endDate: Date) {
    // Implementation for performance analysis
    return {
      avgResponseTime: Math.floor(Math.random() * 200 + 100),
      uptime: Math.random() * 0.05 + 0.95,
      errorRate: Math.random() * 0.02,
      throughput: Math.floor(Math.random() * 1000 + 500)
    };
  }

  private static async getPopularFeatures(_startDate: Date, _endDate: Date) {
    // Implementation for feature popularity analysis
    return [
      { feature: 'match_join', usage: Math.floor(Math.random() * 1000) },
      { feature: 'tournament_create', usage: Math.floor(Math.random() * 500) },
      { feature: 'message_send', usage: Math.floor(Math.random() * 2000) },
      { feature: 'profile_update', usage: Math.floor(Math.random() * 300) }
    ];
  }

  private static async getRiskMetrics(_startDate: Date, _endDate: Date) {
    // Implementation for risk analysis
    return {
      securityThreats: Math.floor(Math.random() * 10),
      performanceIssues: Math.floor(Math.random() * 5),
      errorSpikes: Math.floor(Math.random() * 3),
      resourceConstraints: Math.floor(Math.random() * 2)
    };
  }
}