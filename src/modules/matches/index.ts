/**
 * Matches Module Public API
 */

export {matchesModule} from "./module";
export {MatchService} from "./domain/services/MatchService";
export {
  MatchCreatedEvent,
  MatchCompletedEvent,
  MatchCancelledEvent,
  PlayerJoinedEvent,
  PlayerLeftEvent,
} from "./events/publishers/MatchEventPublisher";
