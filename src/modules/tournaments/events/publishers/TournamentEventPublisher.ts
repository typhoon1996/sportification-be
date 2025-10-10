import { eventBus } from "../../../../shared/events/EventBus";

export const TournamentCreatedEvent = "tournaments.tournament.created";
export const TournamentStartedEvent = "tournaments.tournament.started";
export const TournamentCompletedEvent = "tournaments.tournament.completed";
export const ParticipantJoinedEvent = "tournaments.participant.joined";
export const ParticipantLeftEvent = "tournaments.participant.left";

export class TournamentEventPublisher {
  publishTournamentCreated(payload: {
    tournamentId: string;
    name: string;
    sport: string;
    organizerId: string;
    startDate: Date;
  }): void {
    eventBus.publish({
      eventType: TournamentCreatedEvent,
      aggregateId: payload.tournamentId,
      aggregateType: "Tournament",
      timestamp: new Date(),
      payload,
    });
  }

  publishTournamentStarted(payload: {
    tournamentId: string;
    participantCount: number;
  }): void {
    eventBus.publish({
      eventType: TournamentStartedEvent,
      aggregateId: payload.tournamentId,
      aggregateType: "Tournament",
      timestamp: new Date(),
      payload,
    });
  }

  publishTournamentCompleted(payload: {
    tournamentId: string;
    winnerId: string;
    participants: string[];
  }): void {
    eventBus.publish({
      eventType: TournamentCompletedEvent,
      aggregateId: payload.tournamentId,
      aggregateType: "Tournament",
      timestamp: new Date(),
      payload,
    });
  }

  publishParticipantJoined(payload: {
    tournamentId: string;
    userId: string;
    participantCount: number;
  }): void {
    eventBus.publish({
      eventType: ParticipantJoinedEvent,
      aggregateId: payload.tournamentId,
      aggregateType: "Tournament",
      timestamp: new Date(),
      payload,
    });
  }

  publishParticipantLeft(payload: {
    tournamentId: string;
    userId: string;
  }): void {
    eventBus.publish({
      eventType: ParticipantLeftEvent,
      aggregateId: payload.tournamentId,
      aggregateType: "Tournament",
      timestamp: new Date(),
      payload,
    });
  }
}
