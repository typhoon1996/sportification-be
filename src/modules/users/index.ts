/**
 * Users Module Public API
 */

// Export module instance
export { usersModule } from "./module";

// Export public services
export { UserService } from "./domain/services/UserService";

// Export events (for other modules to subscribe)
export {
  ProfileUpdatedEvent,
  FriendAddedEvent,
  FriendRemovedEvent,
  AchievementUnlockedEvent,
  StatsUpdatedEvent,
} from "./events/publishers/UserEventPublisher";
