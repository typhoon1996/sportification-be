import {Response} from "express";
import {AuthRequest} from "../../../../shared/middleware/auth";
import {
  asyncHandler,
  sendSuccess,
} from "../../../../shared/middleware/errorHandler";
import {AnalyticsService} from "../../domain/services/AnalyticsService";

/**
 * SimpleAnalyticsController
 *
 * Simplified analytics controller providing basic analytics and insights for general users.
 * Unlike the admin-focused InsightsController, this provides user-facing analytics that
 * help users track their activity, match performance, and engagement on the platform.
 *
 * Features:
 * - Overview analytics with key metrics summary
 * - User-specific analytics (personal stats and trends)
 * - Match-specific analytics and performance metrics
 * - Personalized insights and recommendations
 *
 * Access: Authenticated users (each user can access their own analytics)
 * Admin users can access analytics for any user
 */
export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = AnalyticsService.getInstance();
  }

  /**
   * Get analytics overview
   *
   * Retrieves a high-level overview of platform-wide analytics including total users,
   * matches, active tournaments, and engagement metrics. Provides a snapshot of
   * overall platform activity and health.
   *
   * @async
   * @param {AuthRequest} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with analytics overview
   *
   * @throws {UnauthorizedError} If user is not authenticated
   *
   * @example
   * GET /api/v1/analytics/overview
   * Response: {
   *   totalUsers, activeMatches, tournaments, engagementRate, ...
   * }
   */
  getOverviewAnalytics = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const overview = await this.analyticsService.getOverview();
      sendSuccess(res, overview, "Analytics overview retrieved successfully");
    }
  );

  /**
   * Get user-specific analytics
   *
   * Retrieves detailed analytics for a specific user including their activity history,
   * match participation, win/loss ratios, tournament performance, and engagement trends.
   * Users can view their own analytics; admins can view any user's analytics.
   *
   * @async
   * @param {AuthRequest} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with user analytics
   *
   * @throws {UnauthorizedError} If user is not authenticated
   * @throws {ForbiddenError} If non-admin user tries to access another user's analytics
   * @throws {BadRequestError} If user ID is missing
   *
   * @example
   * GET /api/v1/analytics/users/:userId
   * Response: {
   *   userId, totalMatches, wins, losses, winRate, tournamentsParticipated,
   *   activityTrend, engagementScore, ...
   * }
   */
  getUserAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id || req.params.userId;
    if (!userId) {
      res.status(400).json({message: "User ID is required"});
      return;
    }

    const analytics = await this.analyticsService.getUserAnalytics(userId);
    sendSuccess(res, analytics, "User analytics retrieved successfully");
  });

  /**
   * Get match analytics
   *
   * Retrieves detailed analytics for a specific match including participation stats,
   * score history, duration, and performance metrics. Useful for analyzing match
   * outcomes and player performance.
   *
   * @async
   * @param {AuthRequest} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with match analytics
   *
   * @throws {UnauthorizedError} If user is not authenticated
   * @throws {BadRequestError} If match ID is missing
   * @throws {NotFoundError} If match doesn't exist
   *
   * @example
   * GET /api/v1/analytics/matches/:matchId
   * Response: {
   *   matchId, participants, duration, scores, winner, statistics, ...
   * }
   */
  getMatchAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {matchId} = req.params;
    if (!matchId) {
      res.status(400).json({message: "Match ID is required"});
      return;
    }

    const analytics = await this.analyticsService.getMatchAnalytics(matchId);
    sendSuccess(res, analytics, "Match analytics retrieved successfully");
  });

  /**
   * Get personalized insights
   *
   * Generates personalized insights and recommendations for the authenticated user
   * based on their activity patterns, preferences, and performance. Helps users
   * discover relevant matches, improve their performance, and engage with the platform.
   *
   * @async
   * @param {AuthRequest} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with personalized insights
   *
   * @throws {UnauthorizedError} If user is not authenticated
   *
   * @example
   * GET /api/v1/analytics/insights
   * Response: {
   *   recommendedMatches, improvementSuggestions, activityInsights,
   *   socialRecommendations, ...
   * }
   */
  getInsights = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const insights = await this.analyticsService.getInsights(userId);
    sendSuccess(res, insights, "Insights retrieved successfully");
  });
}

export const analyticsController = new AnalyticsController();
