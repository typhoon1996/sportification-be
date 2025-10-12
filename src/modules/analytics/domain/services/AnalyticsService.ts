import { UserActivity } from '../../domain/models/Analytics';
import logger from '../../../../shared/infrastructure/logging';

export class AnalyticsService {
  private static instance: AnalyticsService;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  async trackEvent(eventType: string, userId: string | null, data: Record<string, unknown>) {
    const activity = new UserActivity({
      userId,
      sessionId: 'default',
      activity: {
        type: 'api_call' as const,
        resource: eventType,
        metadata: data,
      },
      timestamp: new Date(),
      device: {
        type: 'desktop' as const,
        os: 'unknown',
        browser: 'unknown',
        userAgent: 'unknown',
      },
    });

    await activity.save();

    logger.info(`Analytics event tracked: ${eventType}`, {
      userId,
      activityId: activity.id,
    });

    return activity;
  }

  async getOverview() {
    const totalUsers = await UserActivity.distinct('userId').then((ids) => ids.length);
    const totalEvents = await UserActivity.countDocuments();
    const recentEvents = await UserActivity.find().sort({ timestamp: -1 }).limit(10);

    return {
      totalUsers,
      totalEvents,
      recentEvents,
    };
  }

  async getMatchAnalytics(matchId: string) {
    const matchEvents = await UserActivity.find({
      'activity.metadata.matchId': matchId,
    });
    return {
      matchId,
      totalEvents: matchEvents.length,
      events: matchEvents,
    };
  }

  async getInsights(userId?: string) {
    const filter = userId ? { userId } : {};
    const recentActivity = await UserActivity.find(filter).sort({ timestamp: -1 }).limit(20);

    return {
      recentActivity,
      timestamp: new Date(),
    };
  }

  async getUserAnalytics(userId: string, startDate?: Date, endDate?: Date) {
    const filter: Record<string, unknown> = { userId };

    if (startDate || endDate) {
      const timestampFilter: Record<string, Date> = {};
      if (startDate) timestampFilter.$gte = startDate;
      if (endDate) timestampFilter.$lte = endDate;
      filter.timestamp = timestampFilter;
    }

    const analytics = await UserActivity.find(filter).sort({ timestamp: -1 });

    return analytics;
  }

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
      { $match: filter },
      {
        $group: {
          _id: '$activity.type',
          count: { $sum: 1 },
          latestTimestamp: { $max: '$timestamp' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return aggregated;
  }

  async getUserStats(userId: string) {
    const stats = await UserActivity.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$activity.type',
          count: { $sum: 1 },
        },
      },
    ]);

    return stats;
  }
}
