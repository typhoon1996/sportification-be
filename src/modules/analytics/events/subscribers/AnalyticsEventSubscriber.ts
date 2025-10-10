import { eventBus, DomainEvent } from "../../../../shared/events/EventBus";
import { AnalyticsService } from "../../domain/services/AnalyticsService";
import { UserRegisteredEvent } from "../../../iam/events/publishers/IAMEventPublisher";
import {
  MatchCreatedEvent,
  PlayerJoinedEvent,
  MatchCompletedEvent,
} from "../../../matches/events/publishers/MatchEventPublisher";
import {
  TournamentCreatedEvent,
  ParticipantJoinedEvent,
  TournamentStartedEvent,
} from "../../../tournaments/events/publishers/TournamentEventPublisher";
import {
  TeamCreatedEvent,
  MemberJoinedEvent,
  MemberLeftEvent,
} from "../../../teams/events/publishers/TeamEventPublisher";
import { MessageSentEvent } from "../../../chat/events/publishers/ChatEventPublisher";

export class AnalyticsEventSubscriber {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  subscribe(): void {
    // User/IAM events
    eventBus.subscribe(UserRegisteredEvent, this.trackEvent("user_registered"));

    // Match events
    eventBus.subscribe(MatchCreatedEvent, this.trackEvent("match_created"));
    eventBus.subscribe(PlayerJoinedEvent, this.trackEvent("match_joined"));
    eventBus.subscribe(MatchCompletedEvent, this.trackEvent("match_completed"));

    // Tournament events
    eventBus.subscribe(
      TournamentCreatedEvent,
      this.trackEvent("tournament_created")
    );
    eventBus.subscribe(
      ParticipantJoinedEvent,
      this.trackEvent("tournament_joined")
    );
    eventBus.subscribe(
      TournamentStartedEvent,
      this.trackEvent("tournament_started")
    );

    // Team events
    eventBus.subscribe(TeamCreatedEvent, this.trackEvent("team_created"));
    eventBus.subscribe(
      MemberJoinedEvent,
      this.trackEvent("team_member_joined")
    );
    eventBus.subscribe(MemberLeftEvent, this.trackEvent("team_member_left"));

    // Chat events
    eventBus.subscribe(MessageSentEvent, this.trackEvent("message_sent"));
  }

  private trackEvent = (eventType: string) => {
    return async (event: DomainEvent): Promise<void> => {
      const payload = event.payload as Record<string, unknown>;
      const userId =
        (payload.userId as string) ||
        (payload.creatorId as string) ||
        (payload.senderId as string) ||
        null;

      await this.analyticsService.trackEvent(eventType, userId, payload);
    };
  };
}
