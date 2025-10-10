import { Response } from "express";
import { AuthRequest } from "../../../../shared/middleware/auth";
import { asyncHandler, sendSuccess } from "../../../../shared/middleware/errorHandler";
import { AnalyticsService } from "../../domain/services/AnalyticsService";

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = AnalyticsService.getInstance();
  }

  /**
   * Get analytics overview
   */
  getOverviewAnalytics = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const overview = await this.analyticsService.getOverview();
      sendSuccess(res, overview, "Analytics overview retrieved successfully");
    }
  );

  /**
   * Get user-specific analytics
   */
  getUserAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id || req.params.userId;
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const analytics = await this.analyticsService.getUserAnalytics(userId);
    sendSuccess(res, analytics, "User analytics retrieved successfully");
  });

  /**
   * Get match analytics
   */
  getMatchAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { matchId } = req.params;
    if (!matchId) {
      res.status(400).json({ message: "Match ID is required" });
      return;
    }

    const analytics = await this.analyticsService.getMatchAnalytics(matchId);
    sendSuccess(res, analytics, "Match analytics retrieved successfully");
  });

  /**
   * Get insights
   */
  getInsights = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const insights = await this.analyticsService.getInsights(userId);
    sendSuccess(res, insights, "Insights retrieved successfully");
  });
}

export const analyticsController = new AnalyticsController();
