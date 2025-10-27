import logger from "../../../../shared/infrastructure/logging";
import {UserActivity} from "../../domain/models/Analytics";

/**
 * AnalyticsService - Business logic for analytics and metrics tracking
 *
 * Singleton service that tracks user activities and provides analytics insights.
 * Handles event tracking, aggregations, and reporting for business intelligence.
 *
 * Features:
 * - Event tracking and logging
 * - User activity monitoring
 * - Match analytics
 * - System-wide metrics
 * - Time-based filtering
 * - Activity aggregations
 *
 * Metrics Tracked:
 * - API calls and resource access
 * - User sessions and activity patterns
 * - Match participation and events
 * - Device and browser information
 */
export class AnalyticsService {
  private static instance: AnalyticsService;

  /**
   * Get singleton instance of AnalyticsService
   *
   * Ensures only one instance exists throughout the application
   * for consistent analytics tracking and data aggregation.
   *
   * @static
   * @return {AnalyticsService} Singleton instance
   */
  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Track an analytics event
   *
   * Records user activity events with metadata for later analysis.
   * Captures event type, user context, device information, and custom data.
   * Logs the event for audit purposes.
   *
   * @async
   * @param {string} eventType - Type of event being tracked (e.g., 'match_created', 'user_login')
   * @param {string | null} userId - User ID if user is authenticated, null for anonymous events
   * @param {Record<string, unknown>} data - Custom event data and metadata
   * @return {Promise<UserActivity>} Created activity record
   *
   * @example
   * await analyticsService.trackEvent('match_created', userId, {
   *   matchId: '123',
   *   sport: 'football',
   *   participants: 10
   * });
   */
  async trackEvent(
    eventType: string,
    userId: string | null,
    data: Record<string, unknown>
  ) {
    const activity = new UserActivity({
      userId,
      sessionId: "default",
      activity: {
        type: "api_call" as const,
        resource: eventType,
        metadata: data,
      },
      timestamp: new Date(),
      device: {
        type: "desktop" as const,
        os: "unknown",
        browser: "unknown",
        userAgent: "unknown",
      },
    });

    await activity.save();

    logger.info(`Analytics event tracked: ${eventType}`, {
      userId,
      activityId: activity.id,
    });

    return activity;
  }

  /**
   * Get analytics overview
   *
   * Retrieves high-level analytics including total users, events, and recent activity.
   * Provides dashboard-level metrics for quick system health assessment.
   *
   * @async
   * @return {Promise<{ totalUsers: number, totalEvents: number, recentEvents: UserActivity[] }>}
   *
   * @example
   * const overview = await analyticsService.getOverview();
   * // Returns: { totalUsers: 150, totalEvents: 5234, recentEvents: [...] }
   */
  async getOverview() {
    const totalUsers = await UserActivity.distinct("userId").then(
      ids => ids.length
    );
    const totalEvents = await UserActivity.countDocuments();
    const recentEvents = await UserActivity.find()
      .sort({timestamp: -1})
      .limit(10);

    return {
      totalUsers,
      totalEvents,
      recentEvents,
    };
  }

  /**
   * Get analytics for a specific match
   *
   * Retrieves all events and activities related to a particular match.
   * Useful for understanding match engagement and participant behavior.
   *
   * @async
   * @param {string} matchId - Match ID to get analytics for
   * @return {Promise<{ matchId: string, totalEvents: number, events: UserActivity[] }>}
   *
   * @example
   * const matchAnalytics = await analyticsService.getMatchAnalytics(matchId);
   */
  async getMatchAnalytics(matchId: string) {
    const matchEvents = await UserActivity.find({
      "activity.metadata.matchId": matchId,
    });
    return {
      matchId,
      totalEvents: matchEvents.length,
      events: matchEvents,
    };
  }

  /**
   * Get user or system insights
   *
   * Retrieves recent activity insights for a specific user or system-wide.
   * Returns recent activity records for behavioral analysis.
   *
   * @async
   * @param {string} [userId] - Optional user ID for user-specific insights
   * @return {Promise<{ recentActivity: UserActivity[], timestamp: Date }>}
   *
   * @example
   * const insights = await analyticsService.getInsights(userId);
   */
  async getInsights(userId?: string) {
    const filter = userId ? {userId} : {};
    const recentActivity = await UserActivity.find(filter)
      .sort({timestamp: -1})
      .limit(20);

    return {
      recentActivity,
      timestamp: new Date(),
    };
  }

  /**
   * Get user-specific analytics with time filtering
   *
   * Retrieves all activities for a user within an optional date range.
   * Supports historical analysis and behavior tracking over time.
   *
   * @async
   * @param {string} userId - User ID to get analytics for
   * @param {Date} [startDate] - Optional start date for filtering
   * @param {Date} [endDate] - Optional end date for filtering
   * @return {Promise<UserActivity[]>} Array of user activities
   *
   * @example
   * const analytics = await analyticsService.getUserAnalytics(
   *   userId,
   *   new Date('2024-01-01'),
   *   new Date('2024-12-31')
   * );
   */
  async getUserAnalytics(userId: string, startDate?: Date, endDate?: Date) {
    const filter: Record<string, unknown> = {userId};

    if (startDate || endDate) {
      const timestampFilter: Record<string, Date> = {};
      if (startDate) timestampFilter.$gte = startDate;
      if (endDate) timestampFilter.$lte = endDate;
      filter.timestamp = timestampFilter;
    }

    const analytics = await UserActivity.find(filter).sort({timestamp: -1});

    return analytics;
  }

  /**
   * Get system-wide analytics with aggregation
   *
   * Retrieves aggregated analytics grouped by activity type.
   * Provides insights into platform usage patterns and popular features.
   * Supports time-based filtering for trend analysis.
   *
   * @async
   * @param {Date} [startDate] - Optional start date for filtering
   * @param {Date} [endDate] - Optional end date for filtering
   * @return {Promise<Array<{ _id: string, count: number, latestTimestamp: Date }>>}
   *
   * @example
   * const systemAnalytics = await analyticsService.getSystemAnalytics(
   *   new Date('2024-01-01'),
   *   new Date('2024-12-31')
   * );
   */
  async getSystemAnalytics(startDate?: Date, endDate?: Date) {
    const filter: Record<string, unknown> = {};

    if (startDate || endDate) {
      const timestampFilter: Record<string, Date> = {};
      if (startDate) timestampFilter.$gte = startDate;
      if (endDate) timestampFilter.$lte = endDate;
      filter.timestamp = timestampFilter;
    }

    // Aggregate analytics by activity type
    const aggregated = await UserActivity.aggregate([
      {$match: filter},
      {
        $group: {
          _id: "$activity.type",
          count: {$sum: 1},
          latestTimestamp: {$max: "$timestamp"},
        },
      },
      {$sort: {count: -1}},
    ]);

    return aggregated;
  }

  /**
   * Get user activity statistics
   *
   * Aggregates user activities by type to show activity distribution.
   * Useful for understanding user engagement patterns and feature usage.
   *
   * @async
   * @param {string} userId - User ID to get statistics for
   * @return {Promise<Array<{ _id: string, count: number }>>} Activity type counts
   *
   * @example
   * const stats = await analyticsService.getUserStats(userId);
   * // Returns: [{ _id: 'api_call', count: 150 }, { _id: 'page_view', count: 89 }]
   */
  async getUserStats(userId: string) {
    const stats = await UserActivity.aggregate([
      {$match: {userId}},
      {
        $group: {
          _id: "$activity.type",
          count: {$sum: 1},
        },
      },
    ]);

    return stats;
  }
}
