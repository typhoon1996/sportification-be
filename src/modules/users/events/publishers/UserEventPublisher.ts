import { eventBus } from "../../../../shared/events/EventBus";

// Event type constants
export const ProfileUpdatedEvent = "users.profile.updated";
export const FriendAddedEvent = "users.friend.added";
export const FriendRemovedEvent = "users.friend.removed";
export const AchievementUnlockedEvent = "users.achievement.unlocked";
export const StatsUpdatedEvent = "users.stats.updated";

export class UserEventPublisher {
  publishProfileUpdated(payload: {
    userId: string;
    updates: string[];
    timestamp: Date;
  }): void {
    eventBus.publish({
      eventType: ProfileUpdatedEvent,
      aggregateId: payload.userId,
      aggregateType: "User",
      timestamp: new Date(),
      payload,
    });
  }

  publishFriendAdded(payload: {
    userId: string;
    friendId: string;
    timestamp: Date;
  }): void {
    eventBus.publish({
      eventType: FriendAddedEvent,
      aggregateId: payload.userId,
      aggregateType: "User",
      timestamp: new Date(),
      payload,
    });
  }

  publishFriendRemoved(payload: {
    userId: string;
    friendId: string;
    timestamp: Date;
  }): void {
    eventBus.publish({
      eventType: FriendRemovedEvent,
      aggregateId: payload.userId,
      aggregateType: "User",
      timestamp: new Date(),
      payload,
    });
  }

  publishAchievementUnlocked(payload: {
    userId: string;
    achievementId: string;
    achievementName: string;
    timestamp: Date;
  }): void {
    eventBus.publish({
      eventType: AchievementUnlockedEvent,
      aggregateId: payload.userId,
      aggregateType: "User",
      timestamp: new Date(),
      payload,
    });
  }

  publishStatsUpdated(payload: {
    userId: string;
    stats: any;
    timestamp: Date;
  }): void {
    eventBus.publish({
      eventType: StatsUpdatedEvent,
      aggregateId: payload.userId,
      aggregateType: "User",
      timestamp: new Date(),
      payload,
    });
  }
}
