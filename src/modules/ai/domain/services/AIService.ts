import { User } from "../../../users/domain/models/User";
import { Match } from "../../../matches/domain/models/Match";
import logger from "../../../../shared/utils/logger";

export class AIService {
  async getMatchRecommendations(userId: string, limit: number = 5) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Get user's preferred sports from preferences
    const preferences = user.preferences as Record<string, unknown>;
    const preferredSports = (preferences?.sports as string[]) || [];

    // Find available matches matching user's preferences
    const query: Record<string, unknown> = {
      status: "scheduled",
      participants: { $ne: userId },
    };

    if (preferredSports.length > 0) {
      query.sport = { $in: preferredSports };
    }

    const recommendations = await Match.find(query)
      .populate("creator", "profile")
      .limit(limit)
      .sort({ createdAt: -1 });

    logger.info(
      `Generated ${recommendations.length} match recommendations for user: ${userId}`
    );

    return recommendations;
  }

  async getUserInsights(userId: string) {
    const user = await User.findById(userId).populate("stats");

    if (!user) {
      throw new Error("User not found");
    }

    // Calculate insights based on user stats
    const insights = {
      totalMatches: user.stats?.matchesPlayed || 0,
      winRate: this.calculateWinRate(user.stats),
      favoritesport: await this.getFavoriteSport(userId),
      activityLevel: this.calculateActivityLevel(user.stats),
      recommendations: await this.getMatchRecommendations(userId, 3),
    };

    return insights;
  }

  async predictMatchOutcome(matchId: string) {
    const match = await Match.findById(matchId).populate("participants");

    if (!match) {
      throw new Error("Match not found");
    }

    // Simple prediction based on historical win rates
    const predictions = [];

    for (const participant of match.participants) {
      const user = await User.findById(participant).populate("stats");
      const winRate = this.calculateWinRate(user?.stats);

      predictions.push({
        userId: participant,
        winProbability: winRate,
      });
    }

    // Normalize probabilities
    const total = predictions.reduce((sum, p) => sum + p.winProbability, 0);
    predictions.forEach((p) => {
      p.winProbability = total > 0 ? p.winProbability / total : 0.5;
    });

    return predictions;
  }

  private calculateWinRate(stats: any): number {
    if (!stats || !stats.matchesPlayed) return 0;
    return stats.wins / stats.matchesPlayed;
  }

  private calculateActivityLevel(stats: any): string {
    if (!stats || !stats.matchesPlayed) return "inactive";

    const matchesPlayed = stats.matchesPlayed;

    if (matchesPlayed >= 50) return "very_active";
    if (matchesPlayed >= 20) return "active";
    if (matchesPlayed >= 5) return "moderate";
    return "beginner";
  }

  private async getFavoriteSport(userId: string): Promise<string> {
    const matches = await Match.find({
      participants: userId,
      status: "completed",
    });

    if (matches.length === 0) return "none";

    // Count sports
    const sportCounts: Record<string, number> = {};
    matches.forEach((match) => {
      sportCounts[match.sport] = (sportCounts[match.sport] || 0) + 1;
    });

    // Find most common sport
    let maxCount = 0;
    let favoriteSport = "none";

    for (const [sport, count] of Object.entries(sportCounts)) {
      if (count > maxCount) {
        maxCount = count;
        favoriteSport = sport;
      }
    }

    return favoriteSport;
  }
}
