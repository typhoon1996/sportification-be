import { eventBus } from "../../../../shared/events/EventBus";
import { MatchCompletedEvent } from "../publishers/MatchEventPublisher";
import { Profile } from "../../../users/domain/models/Profile";
import logger from '../../../../shared/infrastructure/logging';

export class MatchEventSubscriber {
  static initialize(): void {
    // Listen to match completed events to update user stats
    eventBus.subscribe(
      MatchCompletedEvent,
      this.handleMatchCompleted.bind(this)
    );
  }

  private static async handleMatchCompleted(event: any): Promise<void> {
    try {
      const { winnerId, participants } = event.payload;

      if (winnerId) {
        // Update winner stats
        await Profile.findOneAndUpdate(
          { user: winnerId },
          {
            $inc: {
              "stats.matchesPlayed": 1,
              "stats.wins": 1,
            },
          }
        );

        logger.info(`✓ Updated winner stats for user: ${winnerId}`);
      }

      // Update loser stats
      const losers = participants.filter((p: string) => p !== winnerId);
      if (losers.length > 0) {
        await Profile.updateMany(
          { user: { $in: losers } },
          {
            $inc: {
              "stats.matchesPlayed": 1,
              "stats.losses": 1,
            },
          }
        );

        logger.info(`✓ Updated loser stats for ${losers.length} users`);
      }
    } catch (error) {
      logger.error(`❌ Error handling match completed event:`, error);
    }
  }
}
