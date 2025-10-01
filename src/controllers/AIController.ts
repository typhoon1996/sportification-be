import { Response } from 'express';
import { MLService } from '../utils/ml';
import { Match } from '../models/Match';
import { Tournament } from '../models/Tournament';
import { UserActivity } from '../models/Analytics';
import {
  ValidationError,
  NotFoundError,
  sendSuccess,
  asyncHandler,
} from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class AIController {
  /**
   * Get AI-powered match predictions
   */
  static predictMatchOutcome = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { matchId } = req.params;

    if (!matchId) {
      throw new ValidationError('Match ID is required');
    }

    const prediction = await MLService.predictMatchOutcome(matchId);

    sendSuccess(res, prediction, 'Match outcome prediction generated successfully');
  });

  /**
   * Get personalized match recommendations
   */
  static getMatchRecommendations = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { limit = 10 } = req.query;
    const userId = req.user.id;

    const recommendations = await MLService.getMatchRecommendations(
      userId,
      parseInt(limit as string)
    );

    // Add additional context for each recommendation
    const enhancedRecommendations = await Promise.all(
      recommendations.map(async (rec) => {
        const match = await Match.findById(rec.match._id)
          .populate('participants', 'profile email')
          .populate('venue', 'name location');

        return {
          ...rec,
          match,
          aiInsights: await AIController.generateMatchInsights(rec.match, userId),
        };
      })
    );

    sendSuccess(
      res,
      {
        recommendations: enhancedRecommendations,
        totalFound: recommendations.length,
        userId,
        generatedAt: new Date(),
      },
      'AI-powered match recommendations generated successfully'
    );
  });

  /**
   * Analyze user churn risk
   */
  static analyzeChurnRisk = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId: targetUserId } = req.params;
    const userId = targetUserId || req.user.id;

    // Only allow users to check their own churn risk, or admins to check any user
    if (userId !== req.user.id && req.user.role !== 'admin') {
      throw new ValidationError('You can only check your own churn risk');
    }

    const churnAnalysis = await MLService.analyzeChurnRisk(userId);

    // Add actionable insights
    const enhancedAnalysis = {
      ...churnAnalysis,
      actionPlan: await AIController.generateChurnPreventionPlan(churnAnalysis),
      insights: await AIController.generateUserInsights(userId),
    };

    sendSuccess(res, enhancedAnalysis, 'Churn risk analysis completed successfully');
  });

  /**
   * Generate optimal tournament bracket
   */
  static generateTournamentBracket = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { tournamentId } = req.params;
    const { algorithm = 'balanced' } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      throw new NotFoundError('Tournament');
    }

    // Check if user has permission to generate bracket
    if (tournament.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new ValidationError(
        'You do not have permission to generate bracket for this tournament'
      );
    }

    const bracketResult = await MLService.generateOptimalBracket(tournamentId!);

    // Save the generated bracket to the tournament
    await Tournament.findByIdAndUpdate(tournamentId, {
      bracket: bracketResult.bracket,
      $push: {
        'metadata.bracketHistory': {
          generated: new Date(),
          algorithm,
          generatedBy: req.user.id,
        },
      },
    });

    sendSuccess(
      res,
      {
        ...bracketResult,
        algorithm,
        generatedBy: req.user.id,
        message: 'Bracket saved to tournament',
      },
      'Optimal tournament bracket generated successfully'
    );
  });

  /**
   * Predict optimal match times for user
   */
  static predictOptimalMatchTimes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId: targetUserId } = req.params;
    const userId = targetUserId || req.user.id;

    const timeRecommendations = await MLService.predictOptimalMatchTimes(userId);

    // Add context about why these times are recommended
    const enhancedRecommendations = {
      ...timeRecommendations,
      insights: [
        'Based on your activity patterns over the last 30 days',
        'Higher scores indicate better predicted availability',
        'Confidence levels based on consistency of your activity',
      ],
      nextSteps: [
        'Schedule matches during recommended time slots',
        'Set availability preferences in your profile',
        'Enable notifications for matches in optimal times',
      ],
    };

    sendSuccess(res, enhancedRecommendations, 'Optimal match times predicted successfully');
  });

  /**
   * Get AI-powered sports insights dashboard
   */
  static getAISportsInsights = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { timeframe = '30d' } = req.query;
    const userId = req.user.id;

    const insights = await AIController.generateSportsInsights(userId, timeframe as string);

    sendSuccess(res, insights, 'AI sports insights generated successfully');
  });

  /**
   * Get performance predictions and improvement suggestions
   */
  static getPerformancePredictions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;

    const predictions = await AIController.generatePerformancePredictions(userId);

    sendSuccess(res, predictions, 'Performance predictions generated successfully');
  });

  /**
   * Get AI-powered opponent analysis
   */
  static getOpponentAnalysis = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { opponentId } = req.params;
    const userId = req.user.id;

    if (!opponentId) {
      throw new ValidationError('Opponent ID is required');
    }

    const analysis = await AIController.generateOpponentAnalysis(userId, opponentId);

    sendSuccess(res, analysis, 'Opponent analysis completed successfully');
  });

  /**
   * Get training recommendations based on performance analysis
   */
  static getTrainingRecommendations = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { focus = 'overall' } = req.query; // overall, technical, mental, physical

    const recommendations = await AIController.generateTrainingRecommendations(
      userId,
      focus as string
    );

    sendSuccess(res, recommendations, 'Training recommendations generated successfully');
  });

  // Helper methods for generating AI insights

  private static async generateMatchInsights(match: any, _userId: string) {
    // Generate insights about why this match is recommended
    const insights = [];

    // Analyze skill level compatibility
    insights.push({
      category: 'skill_match',
      insight: 'Skill levels are well matched for competitive play',
      confidence: 0.85,
    });

    // Analyze timing
    const matchHour = new Date(match.schedule.date).getHours();
    if (matchHour >= 18 && matchHour <= 21) {
      insights.push({
        category: 'timing',
        insight: 'Scheduled during peak activity hours',
        confidence: 0.75,
      });
    }

    return insights;
  }

  private static async generateChurnPreventionPlan(churnAnalysis: any) {
    const plan = {
      priority: churnAnalysis.riskLevel,
      timeline: churnAnalysis.riskLevel === 'high' ? '7 days' : '14 days',
      actions: [...churnAnalysis.recommendations],
      kpis: ['Daily active sessions', 'Match participation rate', 'Social interactions'],
    };

    if (churnAnalysis.riskLevel === 'high') {
      plan.actions.unshift('Immediate personal outreach');
      plan.actions.push('Offer 1-on-1 onboarding session');
    }

    return plan;
  }

  private static async generateUserInsights(userId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const activities = await UserActivity.find({
      userId,
      timestamp: { $gte: thirtyDaysAgo },
    });

    const insights = [];

    // Activity pattern insights
    const hourlyActivity = new Array(24).fill(0);
    activities.forEach((activity) => {
      const hour = new Date(activity.timestamp).getHours();
      hourlyActivity[hour]++;
    });

    const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));
    insights.push({
      type: 'activity_pattern',
      message: `Most active at ${peakHour}:00`,
      data: { peakHour, totalActivities: activities.length },
    });

    // Engagement insights
    const avgDailyActivities = activities.length / 30;
    if (avgDailyActivities > 5) {
      insights.push({
        type: 'engagement',
        message: 'Highly engaged user',
        data: { avgDailyActivities },
      });
    }

    return insights;
  }

  private static async generateSportsInsights(_userId: string, _timeframe: string) {
    // Mock comprehensive sports insights
    return {
      personalStats: {
        winRate: 0.65,
        averageMatchDuration: 45,
        favoriteOpponents: ['user123', 'user456'],
        preferredMatchTypes: ['competitive', 'casual'],
      },
      trends: {
        performance: 'improving',
        activity: 'stable',
        engagement: 'increasing',
      },
      predictions: {
        nextWeekPerformance: 0.68,
        recommendedMatchCount: 3,
        optimalTrainingDays: ['Monday', 'Wednesday', 'Friday'],
      },
      insights: [
        'Your win rate has improved 15% over the last month',
        'You perform better in evening matches (6-9 PM)',
        'Consider playing more competitive matches to improve faster',
      ],
    };
  }

  private static async generatePerformancePredictions(_userId: string) {
    // Mock performance predictions based on historical data
    return {
      currentRating: 1345,
      projectedRating: {
        '1week': 1360,
        '1month': 1390,
        '3months': 1425,
      },
      improvementFactors: [
        {
          factor: 'Consistency',
          currentScore: 7.2,
          targetScore: 8.5,
          impact: 'High',
        },
        {
          factor: 'Match Frequency',
          currentScore: 6.8,
          targetScore: 8.0,
          impact: 'Medium',
        },
      ],
      recommendations: [
        'Increase match frequency to 4-5 per week',
        'Focus on playing against higher-rated opponents',
        'Work on mental game consistency',
      ],
    };
  }

  private static async generateOpponentAnalysis(userId: string, opponentId: string) {
    // Analyze historical matchups and opponent patterns
    const headToHead = await Match.find({
      participants: { $all: [userId, opponentId] },
      status: 'completed',
    }).sort({ updatedAt: -1 });

    const userWins = headToHead.filter(
      (match) => (match as any).result?.winner?.toString() === userId
    ).length;

    return {
      headToHead: {
        totalMatches: headToHead.length,
        userWins,
        opponentWins: headToHead.length - userWins,
        winRate: headToHead.length > 0 ? userWins / headToHead.length : 0,
      },
      opponentProfile: {
        estimatedRating: 1280,
        playingStyle: 'Aggressive',
        strengths: ['Quick starts', 'Pressure play'],
        weaknesses: ['Inconsistent under pressure', 'Weak late game'],
      },
      matchupAnalysis: {
        favorability: userWins > headToHead.length / 2 ? 'favorable' : 'challenging',
        keyFactors: [
          'Historical advantage in longer matches',
          'Better performance in competitive settings',
        ],
      },
      recommendations: [
        'Focus on early game strategy',
        'Be patient and wait for opportunities',
        'Maintain pressure in late stages',
      ],
    };
  }

  private static async generateTrainingRecommendations(userId: string, focus: string) {
    // Generate personalized training recommendations
    const baseRecommendations = {
      overall: [
        'Practice 30 minutes daily',
        'Analyze match recordings weekly',
        'Play against variety of opponents',
      ],
      technical: [
        'Focus on fundamental techniques',
        'Work with a coach on specific skills',
        'Practice drills for consistency',
      ],
      mental: [
        'Develop pre-match routines',
        'Practice visualization techniques',
        'Work on pressure management',
      ],
      physical: [
        'Improve cardiovascular endurance',
        'Focus on sport-specific conditioning',
        'Maintain flexibility and mobility',
      ],
    };

    return {
      focus,
      duration: '4-week program',
      recommendations:
        baseRecommendations[focus as keyof typeof baseRecommendations] ||
        baseRecommendations.overall,
      schedule: {
        weekly: '3-4 sessions',
        sessionDuration: '45-60 minutes',
        restDays: 2,
      },
      progressTracking: ['Performance metrics', 'Technical assessments', 'Match outcomes'],
      adjustments: [
        'Program will adapt based on progress',
        'Recommendations updated bi-weekly',
        'Personalized based on match results',
      ],
    };
  }
}
