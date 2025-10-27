import {eventBus, DomainEvent} from "../../../../shared/events/EventBus";
import {MessageSentEvent} from "../../../chat/events/publishers/ChatEventPublisher";
import {UserRegisteredEvent} from "../../../iam/events/publishers/IamEventPublisher";
import {
  MatchCreatedEvent,
  PlayerJoinedEvent,
  MatchCompletedEvent,
} from "../../../matches/events/publishers/MatchEventPublisher";
import {
  TeamCreatedEvent,
  MemberJoinedEvent,
  MemberLeftEvent,
} from "../../../teams/events/publishers/TeamEventPublisher";
import {
  TournamentCreatedEvent,
  ParticipantJoinedEvent,
  TournamentStartedEvent,
} from "../../../tournaments/events/publishers/TournamentEventPublisher";
import {
  FriendAddedEvent,
  FriendRemovedEvent,
} from "../../../users/events/publishers/UserEventPublisher";
import {NotificationService} from "../../domain/services/NotificationService";

export class NotificationEventSubscriber {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  subscribe(): void {
    // User/IAM events
    eventBus.subscribe(UserRegisteredEvent, this.handleUserRegistered);
    eventBus.subscribe(FriendAddedEvent, this.handleFriendRequestSent);
    eventBus.subscribe(FriendRemovedEvent, this.handleFriendRequestAccepted);

    // Match events
    eventBus.subscribe(MatchCreatedEvent, this.handleMatchCreated);
    eventBus.subscribe(PlayerJoinedEvent, this.handleMatchJoined);
    eventBus.subscribe(MatchCompletedEvent, this.handleMatchCompleted);

    // Tournament events
    eventBus.subscribe(TournamentCreatedEvent, this.handleTournamentCreated);
    eventBus.subscribe(ParticipantJoinedEvent, this.handleTournamentJoined);
    eventBus.subscribe(TournamentStartedEvent, this.handleTournamentStarted);

    // Team events
    eventBus.subscribe(TeamCreatedEvent, this.handleTeamCreated);
    eventBus.subscribe(MemberJoinedEvent, this.handleMemberJoined);
    eventBus.subscribe(MemberLeftEvent, this.handleMemberLeft);

    // Chat events
    eventBus.subscribe(MessageSentEvent, this.handleMessageSent);
  }

  private handleUserRegistered = async (event: DomainEvent): Promise<void> => {
    const {userId} = event.payload;

    await this.notificationService.createNotification(
      userId,
      "welcome",
      "Welcome to Sportification!",
      "Your account has been created successfully. Start exploring matches and tournaments!"
    );
  };

  private handleFriendRequestSent = async (
    event: DomainEvent
  ): Promise<void> => {
    const {userId, friendId} = event.payload;

    await this.notificationService.createNotification(
      friendId,
      "friend_request",
      "New Friend Request",
      "You have received a new friend request",
      {fromUserId: userId}
    );
  };

  private handleFriendRequestAccepted = async (
    event: DomainEvent
  ): Promise<void> => {
    const {userId, friendId} = event.payload;

    await this.notificationService.createNotification(
      userId,
      "friend_request_accepted",
      "Friend Request Accepted",
      "Your friend request has been accepted",
      {friendId}
    );
  };

  private handleMatchCreated = async (event: DomainEvent): Promise<void> => {
    const {matchId, sport, creatorId} = event.payload;

    await this.notificationService.createNotification(
      creatorId,
      "match_created",
      "Match Created",
      `Your ${sport} match has been created successfully`,
      {matchId}
    );
  };

  private handleMatchJoined = async (event: DomainEvent): Promise<void> => {
    const {matchId, userId, creatorId} = event.payload;

    await this.notificationService.createNotification(
      creatorId,
      "match_joined",
      "Player Joined Match",
      "A player has joined your match",
      {matchId, userId}
    );
  };

  private handleMatchCompleted = async (event: DomainEvent): Promise<void> => {
    const {matchId, participants, winnerId} = event.payload;

    // Notify all participants
    for (const participantId of participants) {
      const isWinner = participantId === winnerId;
      await this.notificationService.createNotification(
        participantId,
        "match_completed",
        "Match Completed",
        isWinner ? "Congratulations! You won the match!" : "Match completed",
        {matchId, isWinner}
      );
    }
  };

  private handleTournamentCreated = async (
    event: DomainEvent
  ): Promise<void> => {
    const {tournamentId, name, creatorId} = event.payload;

    await this.notificationService.createNotification(
      creatorId,
      "tournament_created",
      "Tournament Created",
      `Your tournament "${name}" has been created successfully`,
      {tournamentId}
    );
  };

  private handleTournamentJoined = async (
    event: DomainEvent
  ): Promise<void> => {
    const {tournamentId, userId, organizerId} = event.payload;

    await this.notificationService.createNotification(
      organizerId,
      "tournament_joined",
      "Player Joined Tournament",
      "A player has joined your tournament",
      {tournamentId, userId}
    );
  };

  private handleTournamentStarted = async (
    event: DomainEvent
  ): Promise<void> => {
    const {tournamentId, participants} = event.payload;

    // Notify all participants
    for (const participantId of participants) {
      await this.notificationService.createNotification(
        participantId,
        "tournament_started",
        "Tournament Started",
        "The tournament has started! Check your matches.",
        {tournamentId}
      );
    }
  };

  private handleTeamCreated = async (event: DomainEvent): Promise<void> => {
    const {teamId, name, creatorId} = event.payload;

    await this.notificationService.createNotification(
      creatorId,
      "team_created",
      "Team Created",
      `Your team "${name}" has been created successfully`,
      {teamId}
    );
  };

  private handleMemberJoined = async (event: DomainEvent): Promise<void> => {
    const {teamId, userId, captainId} = event.payload;

    await this.notificationService.createNotification(
      captainId,
      "team_member_joined",
      "New Team Member",
      "A new member has joined your team",
      {teamId, userId}
    );
  };

  private handleMemberLeft = async (event: DomainEvent): Promise<void> => {
    const {teamId, userId, captainId} = event.payload;

    await this.notificationService.createNotification(
      captainId,
      "team_member_left",
      "Team Member Left",
      "A member has left your team",
      {teamId, userId}
    );
  };

  private handleMessageSent = async (event: DomainEvent): Promise<void> => {
    const {chatId, senderId, recipientIds} = event.payload;

    // Notify all recipients
    for (const recipientId of recipientIds) {
      await this.notificationService.createNotification(
        recipientId,
        "new_message",
        "New Message",
        "You have received a new message",
        {chatId, senderId}
      );
    }
  };
}
