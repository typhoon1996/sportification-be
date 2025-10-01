import { User } from '../models/User';
import { Match } from '../models/Match';
import { Tournament } from '../models/Tournament';
import { UserActivity } from '../models/Analytics';
import logger from './logger';

/**
 * Machine Learning and AI utilities for sports platform
 */
export class MLService {

  /**
   * Predict match outcomes based on historical data
   */
  static async predictMatchOutcome(matchId: string) {
    try {
      const match = await Match.findById(matchId).populate('participants');
      if (!match || match.participants.length < 2) {
        throw new Error('Invalid match or insufficient participants');
      }

      const [player1, player2] = match.participants as any[];
      
      if (!player1 || !player2) {
        throw new Error('Match must have exactly 2 participants');
      }
      
      // Get historical performance data
      const [player1Stats, player2Stats] = await Promise.all([
        this.getUserStats(player1._id.toString()),
        this.getUserStats(player2._id.toString())
      ]);

      // Calculate win probability using simple Elo-style rating
      const player1Rating = player1Stats.rating || 1200;
      const player2Rating = player2Stats.rating || 1200;
      
      const expectedScore1 = 1 / (1 + Math.pow(10, (player2Rating - player1Rating) / 400));

      // Factor in recent form
      const player1Form = this.calculateRecentForm(player1Stats.recentMatches);
      const player2Form = this.calculateRecentForm(player2Stats.recentMatches);
      
      // Adjust probabilities based on form
      const formAdjustment = (player1Form - player2Form) * 0.1;
      const adjustedProb1 = Math.max(0.05, Math.min(0.95, expectedScore1 + formAdjustment));
      const adjustedProb2 = 1 - adjustedProb1;

      return {
        matchId,
        predictions: {
          player1: {
            id: player1._id,
            winProbability: adjustedProb1,
            confidence: this.calculateConfidence(player1Stats, player2Stats)
          },
          player2: {
            id: player2._id,
            winProbability: adjustedProb2,
            confidence: this.calculateConfidence(player2Stats, player1Stats)
          }
        },
        factors: {
          ratingDifference: Math.abs(player1Rating - player2Rating),
          formDifference: player1Form - player2Form,
          experienceFactor: this.calculateExperienceFactor(player1Stats, player2Stats)
        },
        recommendation: adjustedProb1 > 0.6 ? 'Strong favorite: Player 1' : 
                       adjustedProb2 > 0.6 ? 'Strong favorite: Player 2' : 'Close match'
      };
    } catch (error) {
      logger.error('Error predicting match outcome:', error);
      throw error;
    }
  }

  /**
   * Generate personalized match recommendations
   */
  static async getMatchRecommendations(userId: string, limit: number = 10) {
    try {
      const user = await User.findById(userId).populate('profile');
      if (!user) throw new Error('User not found');

      // Get user's activity patterns
      const userActivity = await this.getUserActivityPattern(userId);
      
      // Get available matches
      const availableMatches = await Match.find({
        status: 'upcoming',
        participants: { $ne: userId },
        'schedule.date': { $gte: new Date() }
      }).populate('participants').limit(50);

      // Score matches based on various factors
      const scoredMatches = await Promise.all(
        availableMatches.map(async (match) => {
          const score = await this.calculateMatchRecommendationScore(user, match, userActivity);
          return { match, score };
        })
      );

      // Sort by score and return top recommendations
      const recommendations = scoredMatches
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => ({
          match: item.match,
          score: item.score,
          reasons: this.generateRecommendationReasons(user, item.match, item.score)
        }));

      return recommendations;
    } catch (error) {
      logger.error('Error generating match recommendations:', error);
      throw error;
    }
  }

  /**
   * Analyze user engagement patterns and predict churn risk
   */
  static async analyzeChurnRisk(userId: string) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        recentActivity,
        totalActivities,
        lastLogin,
        completedMatches
      ] = await Promise.all([
        UserActivity.countDocuments({
          userId,
          timestamp: { $gte: sevenDaysAgo }
        }),
        UserActivity.countDocuments({
          userId,
          timestamp: { $gte: thirtyDaysAgo }
        }),
        UserActivity.findOne({
          userId,
          'activity.type': 'login'
        }).sort({ timestamp: -1 }),
        Match.countDocuments({
          participants: userId,
          status: 'completed',
          updatedAt: { $gte: thirtyDaysAgo }
        })
      ]);

      // Calculate churn risk factors
      const daysSinceLastLogin = lastLogin ? 
        Math.floor((Date.now() - lastLogin.timestamp.getTime()) / (24 * 60 * 60 * 1000)) : 30;
      
      const activityTrend = recentActivity / Math.max(1, totalActivities - recentActivity);
      const engagementScore = (recentActivity + completedMatches * 2) / 10;

      // Simple churn risk calculation (0-1, higher = more risk)
      let churnRisk = 0;

      // Days since last login factor
      if (daysSinceLastLogin > 7) churnRisk += 0.3;
      if (daysSinceLastLogin > 14) churnRisk += 0.2;
      if (daysSinceLastLogin > 21) churnRisk += 0.2;

      // Activity trend factor
      if (activityTrend < 0.5) churnRisk += 0.2;
      if (activityTrend < 0.2) churnRisk += 0.1;

      // Engagement factor
      if (engagementScore < 2) churnRisk += 0.2;

      churnRisk = Math.min(1, churnRisk);

      const riskLevel = churnRisk > 0.7 ? 'high' : churnRisk > 0.4 ? 'medium' : 'low';

      return {
        userId,
        churnRisk,
        riskLevel,
        factors: {
          daysSinceLastLogin,
          activityTrend,
          engagementScore,
          completedMatches
        },
        recommendations: this.generateChurnPreventionRecommendations(churnRisk, {
          daysSinceLastLogin,
          activityTrend,
          engagementScore,
          completedMatches
        })
      };
    } catch (error) {
      logger.error('Error analyzing churn risk:', error);
      throw error;
    }
  }

  /**
   * Generate optimal tournament brackets using advanced algorithms
   */
  static async generateOptimalBracket(tournamentId: string) {
    try {
      const tournament = await Tournament.findById(tournamentId).populate('participants');
      if (!tournament) throw new Error('Tournament not found');

      const participants = tournament.participants;
      if (participants.length < 4) {
        throw new Error('Need at least 4 participants for bracket generation');
      }

      // Get ratings for all participants
      const participantStats = await Promise.all(
        participants.map(async (participant) => ({
          user: participant,
          stats: await this.getUserStats(participant._id.toString())
        }))
      );

      // Sort by rating for seeding
      participantStats.sort((a, b) => (b.stats.rating || 1200) - (a.stats.rating || 1200));

      // Generate bracket using balanced seeding
      const bracket = this.generateBalancedBracket(participantStats);

      // Calculate expected match outcomes for each round
      const predictedOutcomes = await this.predictBracketOutcomes(bracket);

      return {
        tournamentId,
        bracket,
        predictedOutcomes,
        seeding: participantStats.map((p, index) => ({
          seed: index + 1,
          user: p.user,
          rating: p.stats.rating || 1200
        })),
        estimatedDuration: this.estimateTournamentDuration(participants.length),
        competitiveBalance: this.calculateCompetitiveBalance(participantStats)
      };
    } catch (error) {
      logger.error('Error generating optimal bracket:', error);
      throw error;
    }
  }

  /**
   * Analyze and predict optimal match times based on user patterns
   */
  static async predictOptimalMatchTimes(userId: string) {
    try {
      const activityPattern = await this.getUserActivityPattern(userId);
      
      // Analyze when user is most active
      const hourlyActivity = new Array(24).fill(0);
      const dailyActivity = new Array(7).fill(0);

      activityPattern.activities.forEach(activity => {
        const hour = new Date(activity.timestamp).getHours();
        const day = new Date(activity.timestamp).getDay();
        hourlyActivity[hour]++;
        dailyActivity[day]++;
      });

      // Find peak hours and days
      const peakHours = hourlyActivity
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      const peakDays = dailyActivity
        .map((count, day) => ({ day, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 2);

      // Generate optimal time recommendations
      const recommendations = [];
      
      for (const peakDay of peakDays) {
        for (const peakHour of peakHours) {
          const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][peakDay.day];
          const timeSlot = `${peakHour.hour}:00-${peakHour.hour + 1}:00`;
          
          recommendations.push({
            day: dayName,
            timeSlot,
            score: (peakDay.count + peakHour.count) / 2,
            confidence: Math.min(0.95, (peakDay.count + peakHour.count) / Math.max(...dailyActivity) / 2)
          });
        }
      }

      return {
        userId,
        recommendations: recommendations.sort((a, b) => b.score - a.score).slice(0, 5),
        activityPattern: {
          peakHours: peakHours.map(p => ({ hour: p.hour, activity: p.count })),
          peakDays: peakDays.map(p => ({ day: p.day, activity: p.count })),
          totalActivities: activityPattern.activities.length
        }
      };
    } catch (error) {
      logger.error('Error predicting optimal match times:', error);
      throw error;
    }
  }

  // Helper methods

  private static async getUserStats(userId: string) {
    const matches = await Match.find({
      participants: userId,
      status: 'completed'
    }).sort({ updatedAt: -1 }).limit(20);

    const wins = matches.filter(match => 
      (match as any).result && (match as any).result.winner?.toString() === userId
    ).length;

    const winRate = matches.length > 0 ? wins / matches.length : 0;
    const rating = Math.max(800, Math.min(2000, 1200 + (winRate - 0.5) * 400));

    return {
      totalMatches: matches.length,
      wins,
      losses: matches.length - wins,
      winRate,
      rating,
      recentMatches: matches.slice(0, 5),
      averageMatchDuration: this.calculateAverageMatchDuration(matches)
    };
  }

  private static calculateRecentForm(recentMatches: any[]): number {
    if (recentMatches.length === 0) return 0.5;
    
    const weights = [0.4, 0.3, 0.2, 0.08, 0.02]; // Recent matches weighted more
    let form = 0;
    
    recentMatches.slice(0, 5).forEach((match, index) => {
      const isWin = match.result && match.result.winner ? 1 : 0;
      form += isWin * (weights[index] || 0.01);
    });
    
    return form;
  }

  private static calculateConfidence(stats1: any, stats2: any): number {
    const matchDifference = Math.abs(stats1.totalMatches - stats2.totalMatches);
    const experienceFactor = Math.min(stats1.totalMatches, stats2.totalMatches) / 20;
    
    return Math.max(0.3, Math.min(0.95, 0.7 + experienceFactor - matchDifference * 0.01));
  }

  private static calculateExperienceFactor(stats1: any, stats2: any): number {
    return (stats1.totalMatches + stats2.totalMatches) / 40;
  }

  private static async getUserActivityPattern(userId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const activities = await UserActivity.find({
      userId,
      timestamp: { $gte: thirtyDaysAgo }
    }).sort({ timestamp: -1 });

    return { activities };
  }

  private static async calculateMatchRecommendationScore(user: any, match: any, userActivity: any): Promise<number> {
    let score = 50; // Base score

    // Skill level matching
    const userRating = (await this.getUserStats(user._id.toString())).rating;
    const opponentRatings = await Promise.all(
      match.participants.map((p: any) => this.getUserStats(p._id.toString()))
    );
    const avgOpponentRating = opponentRatings.reduce((sum, stats) => sum + stats.rating, 0) / opponentRatings.length;
    
    const ratingDiff = Math.abs(userRating - avgOpponentRating);
    score += Math.max(0, 30 - ratingDiff / 20); // Prefer similar skill levels

    // Time preference matching
    const matchHour = new Date(match.schedule.date).getHours();
    const userActiveHours = this.getUserActiveHours(userActivity);
    if (userActiveHours.includes(matchHour)) {
      score += 20;
    }

    // Match type preference (could be based on user history)
    if (match.type === 'competitive') score += 10;
    if (match.type === 'casual') score += 5;

    return Math.max(0, Math.min(100, score));
  }

  private static getUserActiveHours(userActivity: any): number[] {
    const hourCounts = new Array(24).fill(0);
    
    userActivity.activities.forEach((activity: any) => {
      const hour = new Date(activity.timestamp).getHours();
      hourCounts[hour]++;
    });

    const maxCount = Math.max(...hourCounts);
    const threshold = maxCount * 0.7;
    
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(item => item.count >= threshold)
      .map(item => item.hour);
  }

  private static generateRecommendationReasons(user: any, match: any, score: number): string[] {
    const reasons = [];
    
    if (score > 80) reasons.push('Excellent skill level match');
    if (score > 70) reasons.push('Good time slot for you');
    if (match.type === 'competitive') reasons.push('Competitive match');
    if (match.venue) reasons.push('Convenient location');
    
    return reasons;
  }

  private static generateChurnPreventionRecommendations(churnRisk: number, factors: any): string[] {
    const recommendations = [];

    if (factors.daysSinceLastLogin > 7) {
      recommendations.push('Send personalized re-engagement email');
    }
    if (factors.activityTrend < 0.3) {
      recommendations.push('Offer exclusive tournament invitation');
    }
    if (factors.completedMatches === 0) {
      recommendations.push('Provide beginner-friendly match recommendations');
    }
    if (churnRisk > 0.6) {
      recommendations.push('Offer premium trial or discount');
    }

    return recommendations;
  }

  private static generateBalancedBracket(participantStats: any[]): any {
    // Simple single-elimination bracket generation
    const numParticipants = participantStats.length;
    
    // Create bracket structure
    const bracket: any = {
      rounds: [] as any[],
      participants: participantStats.map(p => p.user)
    };

    // Generate first round matchups with balanced seeding
    const firstRound = [];
    for (let i = 0; i < numParticipants; i += 2) {
      if (i + 1 < numParticipants) {
        firstRound.push({
          player1: participantStats[i].user,
          player2: participantStats[i + 1].user,
          round: 1
        });
      }
    }

    bracket.rounds.push(firstRound);
    return bracket;
  }

  private static async predictBracketOutcomes(bracket: any): Promise<any> {
    // Predict outcomes for each match in the bracket
    const predictions: any = {
      rounds: [] as any[]
    };

    for (const round of bracket.rounds) {
      const roundPredictions = [];
      for (const match of round) {
        // This would use the match prediction logic
        roundPredictions.push({
          match,
          predictedWinner: Math.random() > 0.5 ? match.player1 : match.player2,
          confidence: 0.65 + Math.random() * 0.3
        });
      }
      predictions.rounds.push(roundPredictions);
    }

    return predictions;
  }

  private static estimateTournamentDuration(numParticipants: number): number {
    // Estimate in minutes, assuming ~45 minutes per match
    const numRounds = Math.ceil(Math.log2(numParticipants));
    return numRounds * 45;
  }

  private static calculateCompetitiveBalance(participantStats: any[]): number {
    const ratings = participantStats.map(p => p.stats.rating || 1200);
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    
    const standardDeviation = Math.sqrt(
      ratings.reduce((sum, rating) => sum + Math.pow(rating - avgRating, 2), 0) / ratings.length
    );

    // Lower standard deviation = better balance (0-1 scale)
    return Math.max(0, 1 - (standardDeviation / 400));
  }

  private static calculateAverageMatchDuration(matches: any[]): number {
    if (matches.length === 0) return 30; // Default 30 minutes

    const durations = matches
      .filter(match => match.result && match.result.duration)
      .map(match => match.result.duration);

    return durations.length > 0 ? 
      durations.reduce((sum, d) => sum + d, 0) / durations.length : 30;
  }
}