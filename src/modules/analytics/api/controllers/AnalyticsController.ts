import {Request, Response} from "express";
import {AnalyticsService} from "../../../../shared/services/analytics";
import {
  UserActivity,
  PerformanceMetrics,
  BusinessMetrics,
  SystemHealth,
} from "../../domain/models/Analytics";
import {User} from "../../../users/domain/models/User";
import {Match} from "../../../matches/domain/models/Match";
import {Tournament} from "../../../tournaments/domain/models/Tournament";
import {
  ValidationError,
  sendSuccess,
  asyncHandler,
} from "../../../../shared/middleware/errorHandler";
import {AuthRequest} from "../../../../shared/middleware/auth";

/**
 * AnalyticsController - Handles analytics and business intelligence HTTP requests
 *
 * This controller provides comprehensive analytics endpoints for monitoring system performance,
 * user engagement, business metrics, and predictive insights. It aggregates data from multiple
 * sources to provide actionable intelligence for administrators and stakeholders.
 *
 * Features:
 * - Real-time dashboard with KPIs
 * - User engagement and retention analytics
 * - Performance monitoring and optimization insights
 * - Business intelligence and revenue tracking
 * - System health monitoring
 * - Predictive analytics and forecasting
 * - Custom report generation
 *
 * Access Control:
 * - Most endpoints restricted to Admin/Moderator roles
 * - Some endpoints available to authenticated users for personal analytics
 *
 * @class AnalyticsController
 */
export class AnalyticsController {
  /**
   * Get comprehensive dashboard with real-time analytics
   *
   * Retrieves a real-time analytics dashboard with key performance indicators,
   * user statistics, system metrics, and business insights. The dashboard provides
   * an at-a-glance view of platform health and performance.
   *
   * Dashboard Metrics:
   * - Active users (daily/weekly/monthly)
   * - Match and tournament statistics
   * - System performance indicators
   * - Revenue and engagement trends
   * - Growth metrics and forecasts
   *
   * @async
   * @param {AuthRequest} req - Authenticated request with optional timeframe
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with dashboard data and insights
   *
   * @requires Authentication - User must be authenticated
   * @requires Authorization - Admin or Moderator role (enforced by route middleware)
   *
   * Query Parameters:
   * - timeframe: Analysis period (day, week, month, year) - default: week
   *
   * @example
   * GET /api/v1/analytics/dashboard?timeframe=month
   */
  static getAnalyticsDashboard = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const {timeframe = "week"} = req.query;

      const dashboard = await AnalyticsService.getRealtimeDashboard();
      const insights = await AnalyticsService.generateInsights(
        timeframe as any
      );

      sendSuccess(
        res,
        {
          dashboard,
          insights,
          timestamp: new Date(),
        },
        "Analytics dashboard retrieved successfully"
      );
    }
  );

  /**
   * Get user engagement analytics
   *
   * Provides detailed analytics on user engagement including activity patterns,
   * feature adoption, retention rates, and user behavior trends. Helps identify
   * most engaged users and understand usage patterns.
   *
   * Metrics Included:
   * - Active users count and percentage
   * - Session duration and frequency
   * - Feature usage statistics
   * - Engagement rate calculations
   * - User activity timeline
   *
   * @async
   * @param {AuthRequest} req - Authenticated request with date range
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with engagement analytics
   *
   * @requires Authentication - User must be authenticated
   * @requires Authorization - Admin or Moderator role (enforced by route middleware)
   *
   * Query Parameters:
   * - startDate: Start date for analysis (ISO 8601 format) - required
   * - endDate: End date for analysis (ISO 8601 format) - required
   * - userId: Filter by specific user (optional)
   *
   * @throws {ValidationError} If date parameters are missing or invalid
   *
   * @example
   * GET /api/v1/analytics/users?startDate=2025-01-01&endDate=2025-01-31
   */
  static getUserEngagementAnalytics = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const {startDate, endDate, userId} = req.query;

      if (!startDate || !endDate) {
        throw new ValidationError("Start date and end date are required");
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ValidationError("Invalid date format");
      }

      const analytics = await AnalyticsService.getUserEngagementAnalytics({
        userId: userId as string,
        startDate: start,
        endDate: end,
      });

      // Get additional user metrics
      const totalUsers = await User.countDocuments();
      const activeUsers = await UserActivity.distinct("userId", {
        timestamp: {$gte: start, $lte: end},
      });

      const engagementSummary = {
        totalUsers,
        activeUsers: activeUsers.length,
        engagementRate:
          totalUsers > 0 ? (activeUsers.length / totalUsers) * 100 : 0,
        analytics,
      };

      sendSuccess(
        res,
        engagementSummary,
        "User engagement analytics retrieved successfully"
      );
    }
  );

  /**
   * Get performance analytics
   */
  static getPerformanceAnalytics = asyncHandler(
    async (req: Request, res: Response) => {
      const {startDate, endDate, endpoint} = req.query;

      if (!startDate || !endDate) {
        throw new ValidationError("Start date and end date are required");
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const analytics = await AnalyticsService.getPerformanceAnalytics({
        endpoint: endpoint as string,
        startDate: start,
        endDate: end,
      });

      // Get additional performance insights
      const [slowestEndpoints, errorHotspots, cacheEfficiency] =
        await Promise.all([
          PerformanceMetrics.aggregate([
            {$match: {timestamp: {$gte: start, $lte: end}}},
            {
              $group: {
                _id: "$endpoint",
                avgResponseTime: {$avg: "$responseTime"},
                requests: {$sum: 1},
              },
            },
            {$sort: {avgResponseTime: -1}},
            {$limit: 10},
          ]),

          PerformanceMetrics.aggregate([
            {
              $match: {
                timestamp: {$gte: start, $lte: end},
                statusCode: {$gte: 400},
              },
            },
            {
              $group: {
                _id: "$endpoint",
                errorCount: {$sum: 1},
                totalRequests: {$sum: 1},
              },
            },
            {$sort: {errorCount: -1}},
            {$limit: 10},
          ]),

          PerformanceMetrics.aggregate([
            {$match: {timestamp: {$gte: start, $lte: end}}},
            {
              $group: {
                _id: null,
                totalCacheHits: {$sum: "$cacheHits"},
                totalCacheMisses: {$sum: "$cacheMisses"},
              },
            },
            {
              $project: {
                hitRate: {
                  $divide: [
                    "$totalCacheHits",
                    {$add: ["$totalCacheHits", "$totalCacheMisses"]},
                  ],
                },
              },
            },
          ]),
        ]);

      const performanceSummary = {
        analytics,
        insights: {
          slowestEndpoints,
          errorHotspots,
          cacheHitRate: cacheEfficiency[0]?.hitRate || 0,
        },
      };

      sendSuccess(
        res,
        performanceSummary,
        "Performance analytics retrieved successfully"
      );
    }
  );

  /**
   * Get business intelligence metrics
   */
  static getBusinessIntelligence = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const {category, startDate, endDate, aggregation = "day"} = req.query;

      if (!startDate || !endDate) {
        throw new ValidationError("Start date and end date are required");
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Get business metrics
      const pipeline = [
        {
          $match: {
            timestamp: {$gte: start, $lte: end},
            ...(category && {category}),
          },
        },
        {
          $group: {
            _id: {
              metric: "$metric",
              period: {
                $dateToString: {
                  format:
                    aggregation === "hour" ? "%Y-%m-%d %H:00" : "%Y-%m-%d",
                  date: "$timestamp",
                },
              },
            },
            totalValue: {$sum: "$value"},
            avgValue: {$avg: "$value"},
            count: {$sum: 1},
          },
        },
        {$sort: {"_id.period": 1 as const}},
      ];

      const businessMetrics = await BusinessMetrics.aggregate(pipeline);

      // Get key business indicators
      const [
        totalMatches,
        totalTournaments,
        activeUsers24h,
        revenue, // This would come from a payment system
      ] = await Promise.all([
        Match.countDocuments({
          createdAt: {$gte: start, $lte: end},
        }),
        Tournament.countDocuments({
          createdAt: {$gte: start, $lte: end},
        }),
        UserActivity.distinct("userId", {
          timestamp: {$gte: new Date(Date.now() - 24 * 60 * 60 * 1000)},
        }),
        BusinessMetrics.aggregate([
          {
            $match: {
              metric: "revenue",
              timestamp: {$gte: start, $lte: end},
            },
          },
          {$group: {_id: null, total: {$sum: "$value"}}},
        ]),
      ]);

      const businessIntelligence = {
        kpis: {
          totalMatches,
          totalTournaments,
          activeUsers24h: activeUsers24h.length,
          revenue: revenue[0]?.total || 0,
        },
        metrics: businessMetrics,
        trends: await this.calculateTrends(businessMetrics),
      };

      sendSuccess(
        res,
        businessIntelligence,
        "Business intelligence retrieved successfully"
      );
    }
  );

  /**
   * Get system health monitoring
   */
  static getSystemHealthMonitoring = asyncHandler(
    async (req: Request, res: Response) => {
      const {component, timeframe = "1h"} = req.query;

      let startDate: Date;
      const endDate = new Date();

      switch (timeframe) {
        case "1h":
          startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
          break;
        case "24h":
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
      }

      const healthData = await SystemHealth.find({
        ...(component && {component}),
        timestamp: {$gte: startDate, $lte: endDate},
      }).sort({timestamp: -1});

      // Calculate health score
      const healthScore = this.calculateHealthScore(healthData);

      // Get alerts
      const criticalAlerts = healthData
        .filter(h => h.alerts && h.alerts.some(a => a.level === "critical"))
        .slice(0, 10);

      const monitoring = {
        healthScore,
        currentStatus: healthData[0]?.status || "unknown",
        healthData: healthData.slice(0, 100), // Limit to last 100 records
        criticalAlerts: criticalAlerts.map(h => ({
          component: h.component,
          alerts: h.alerts?.filter(a => a.level === "critical"),
          timestamp: h.timestamp,
        })),
        summary: {
          healthy: healthData.filter(h => h.status === "healthy").length,
          degraded: healthData.filter(h => h.status === "degraded").length,
          down: healthData.filter(h => h.status === "down").length,
        },
      };

      sendSuccess(
        res,
        monitoring,
        "System health monitoring retrieved successfully"
      );
    }
  );

  /**
   * Get predictive analytics
   */
  static getPredictiveAnalytics = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const {metric, horizon = "7d"} = req.query;

      // This is a simplified predictive model
      // In production, you'd use ML models or time series forecasting
      const now = new Date();
      const pastData = await this.getHistoricalData(metric as string, 30); // Get 30 days of data

      const predictions = this.generatePredictions(pastData, horizon as string);

      const predictiveAnalytics = {
        metric,
        horizon,
        confidence: 0.75, // Mock confidence score
        predictions,
        recommendations: this.generateRecommendations(predictions),
        lastUpdated: now,
      };

      sendSuccess(
        res,
        predictiveAnalytics,
        "Predictive analytics retrieved successfully"
      );
    }
  );

  /**
   * Get custom reports
   */
  static getCustomReports = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const {reportType, dimensions, metrics, filters, startDate, endDate} =
        req.body;

      if (!reportType || !startDate || !endDate) {
        throw new ValidationError(
          "Report type, start date, and end date are required"
        );
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      let reportData;

      switch (reportType) {
        case "user_retention":
          reportData = await this.generateUserRetentionReport(
            start,
            end,
            filters
          );
          break;
        case "feature_adoption":
          reportData = await this.generateFeatureAdoptionReport(
            start,
            end,
            filters
          );
          break;
        case "performance_summary":
          reportData = await this.generatePerformanceSummaryReport(
            start,
            end,
            filters
          );
          break;
        case "revenue_analysis":
          reportData = await this.generateRevenueAnalysisReport(
            start,
            end,
            filters
          );
          break;
        default:
          throw new ValidationError("Invalid report type");
      }

      const customReport = {
        reportType,
        generatedAt: new Date(),
        period: {start, end},
        data: reportData,
        metadata: {
          totalRecords: Array.isArray(reportData) ? reportData.length : 1,
          filters,
          dimensions,
          metrics,
        },
      };

      sendSuccess(res, customReport, "Custom report generated successfully");
    }
  );

  // Helper methods
  private static calculateTrends(metrics: any[]) {
    // Simple trend calculation
    const trends: Record<string, number> = {};

    metrics.forEach(metric => {
      const key = metric._id.metric;
      if (!trends[key]) trends[key] = 0;
      trends[key] += metric.totalValue;
    });

    return Object.entries(trends).map(([metric, value]) => ({
      metric,
      trend: value > 0 ? "increasing" : value < 0 ? "decreasing" : "stable",
      change: value,
    }));
  }

  private static calculateHealthScore(healthData: any[]) {
    if (healthData.length === 0) return 0;

    const scores = healthData.map(h => {
      switch (h.status) {
        case "healthy":
          return 100;
        case "degraded":
          return 50;
        case "down":
          return 0;
        default:
          return 25;
      }
    });

    return (
      scores.reduce((sum: number, score: number) => sum + score, 0) /
      scores.length
    );
  }

  private static async getHistoricalData(metric: string, days: number) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    return BusinessMetrics.find({
      metric,
      timestamp: {$gte: startDate, $lte: endDate},
    }).sort({timestamp: 1});
  }

  private static generatePredictions(data: any[], horizon: string) {
    // Simple linear regression for prediction
    // In production, use proper ML models
    const values = data.map(d => d.value);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

    const days = parseInt(horizon.replace("d", ""));
    const predictions = [];

    for (let i = 1; i <= days; i++) {
      predictions.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        predicted_value: avg * (1 + Math.random() * 0.2 - 0.1), // ±10% variation
        confidence: Math.max(0.5, 1 - (i / days) * 0.3), // Decreasing confidence
      });
    }

    return predictions;
  }

  private static generateRecommendations(predictions: any[]) {
    const avgPrediction =
      predictions.reduce((sum, p) => sum + p.predicted_value, 0) /
      predictions.length;

    const recommendations = [];

    if (avgPrediction > 1000) {
      recommendations.push({
        type: "scale_up",
        priority: "high",
        message: "Consider scaling up infrastructure based on predicted load",
      });
    }

    if (predictions.some(p => p.confidence < 0.7)) {
      recommendations.push({
        type: "data_quality",
        priority: "medium",
        message: "Improve data collection for better prediction accuracy",
      });
    }

    return recommendations;
  }

  private static async generateUserRetentionReport(
    _start: Date,
    _end: Date,
    _filters: unknown
  ) {
    // Implementation for user retention analysis
    return {
      dailyRetention: [],
      weeklyRetention: [],
      monthlyRetention: [],
      cohortAnalysis: [],
    };
  }

  private static async generateFeatureAdoptionReport(
    start: Date,
    end: Date,
    _filters: unknown
  ) {
    return UserActivity.aggregate([
      {$match: {timestamp: {$gte: start, $lte: end}}},
      {
        $group: {
          _id: "$activity.type",
          uniqueUsers: {$addToSet: "$userId"},
          totalUsage: {$sum: 1},
        },
      },
      {
        $project: {
          feature: "$_id",
          adoptionRate: {$size: "$uniqueUsers"},
          totalUsage: 1,
        },
      },
      {$sort: {adoptionRate: -1}},
    ]);
  }

  private static async generatePerformanceSummaryReport(
    start: Date,
    end: Date,
    _filters: unknown
  ) {
    return PerformanceMetrics.aggregate([
      {$match: {timestamp: {$gte: start, $lte: end}}},
      {
        $group: {
          _id: "$endpoint",
          avgResponseTime: {$avg: "$responseTime"},
          totalRequests: {$sum: 1},
          errorRate: {
            $avg: {$cond: [{$gte: ["$statusCode", 400]}, 1, 0]},
          },
        },
      },
      {$sort: {totalRequests: -1}},
    ]);
  }

  private static async generateRevenueAnalysisReport(
    start: Date,
    end: Date,
    _filters: unknown
  ) {
    return BusinessMetrics.aggregate([
      {
        $match: {
          category: "revenue",
          timestamp: {$gte: start, $lte: end},
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {format: "%Y-%m-%d", date: "$timestamp"},
          },
          totalRevenue: {$sum: "$value"},
          transactions: {$sum: 1},
        },
      },
      {$sort: {_id: 1}},
    ]);
  }
}
