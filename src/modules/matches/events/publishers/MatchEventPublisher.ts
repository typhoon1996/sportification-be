import {eventBus} from "../../../../shared/events/EventBus";

export const MatchCreatedEvent = "matches.match.created";
export const MatchCompletedEvent = "matches.match.completed";
export const MatchCancelledEvent = "matches.match.cancelled";
export const PlayerJoinedEvent = "matches.player.joined";
export const PlayerLeftEvent = "matches.player.left";
export const MatchStatusChangedEvent = "matches.match.status.changed";
export const MatchScoreUpdatedEvent = "matches.match.score.updated";

export class MatchEventPublisher {
  publishMatchCreated(payload: {
    matchId: string;
    createdBy: string;
    sport: string;
    scheduledDate: Date;
    type: string;
  }): void {
    eventBus.publish({
      eventType: MatchCreatedEvent,
      aggregateId: payload.matchId,
      aggregateType: "Match",
      timestamp: new Date(),
      payload,
    });
  }

  publishMatchCompleted(payload: {
    matchId: string;
    winnerId?: string;
    participants: string[];
    sport: string;
  }): void {
    eventBus.publish({
      eventType: MatchCompletedEvent,
      aggregateId: payload.matchId,
      aggregateType: "Match",
      timestamp: new Date(),
      payload,
    });
  }

  publishMatchCancelled(payload: {matchId: string; reason: string}): void {
    eventBus.publish({
      eventType: MatchCancelledEvent,
      aggregateId: payload.matchId,
      aggregateType: "Match",
      timestamp: new Date(),
      payload,
    });
  }

  publishPlayerJoined(payload: {
    matchId: string;
    userId: string;
    sport: string;
  }): void {
    eventBus.publish({
      eventType: PlayerJoinedEvent,
      aggregateId: payload.matchId,
      aggregateType: "Match",
      timestamp: new Date(),
      payload,
    });
  }

  publishPlayerLeft(payload: {matchId: string; userId: string}): void {
    eventBus.publish({
      eventType: PlayerLeftEvent,
      aggregateId: payload.matchId,
      aggregateType: "Match",
      timestamp: new Date(),
      payload,
    });
  }

  publishStatusChanged(payload: {
    matchId: string;
    oldStatus: string;
    newStatus: string;
  }): void {
    eventBus.publish({
      eventType: MatchStatusChangedEvent,
      aggregateId: payload.matchId,
      aggregateType: "Match",
      timestamp: new Date(),
      payload,
    });
  }

  publishScoreUpdated(payload: {
    matchId: string;
    score: any;
    updatedBy: string;
  }): void {
    eventBus.publish({
      eventType: MatchScoreUpdatedEvent,
      aggregateId: payload.matchId,
      aggregateType: "Match",
      timestamp: new Date(),
      payload,
    });
  }
}
