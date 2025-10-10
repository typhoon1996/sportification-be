import { Response } from "express";
import { AIService } from "../../domain/services/AIService";
import { sendSuccess, asyncHandler } from "../../../../shared/middleware/errorHandler";
import { AuthRequest } from "../../../../shared/middleware/auth";
import logger from "../../../../shared/utils/logger";

export class AIController {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  getRecommendations = asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

    const recommendations = await this.aiService.getMatchRecommendations(
      req.userId!,
      limit
    );

    logger.info(`Recommendations generated for user: ${req.userId}`, {
      count: recommendations.length,
    });

    sendSuccess(res, { recommendations });
  });

  getPredictions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { matchId } = req.body;

    const predictions = await this.aiService.predictMatchOutcome(matchId);

    logger.info(`Predictions generated for match: ${matchId}`);

    sendSuccess(res, { predictions });
  });

  getInsights = asyncHandler(async (req: AuthRequest, res: Response) => {
    const insights = await this.aiService.getUserInsights(req.userId!);

    logger.info(`Insights generated for user: ${req.userId}`);

    sendSuccess(res, { insights });
  });
}

export const aiController = new AIController();
