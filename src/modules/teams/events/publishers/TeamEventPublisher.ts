import { eventBus } from "../../../../shared/events/EventBus";

export const TeamCreatedEvent = "teams.team.created";
export const MemberJoinedEvent = "teams.member.joined";
export const MemberLeftEvent = "teams.member.left";

export class TeamEventPublisher {
  publishTeamCreated(payload: {
    teamId: string;
    name: string;
    captainId: string;
    sport: string;
  }): void {
    eventBus.publish({
      eventType: TeamCreatedEvent,
      aggregateId: payload.teamId,
      aggregateType: "Team",
      timestamp: new Date(),
      payload,
    });
  }

  publishMemberJoined(payload: {
    teamId: string;
    userId: string;
    memberCount: number;
  }): void {
    eventBus.publish({
      eventType: MemberJoinedEvent,
      aggregateId: payload.teamId,
      aggregateType: "Team",
      timestamp: new Date(),
      payload,
    });
  }

  publishMemberLeft(payload: { teamId: string; userId: string }): void {
    eventBus.publish({
      eventType: MemberLeftEvent,
      aggregateId: payload.teamId,
      aggregateType: "Team",
      timestamp: new Date(),
      payload,
    });
  }
}
