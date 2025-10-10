import { Match } from "../../../matches/domain/models/Match";
import { MatchEventPublisher } from "../../events/publishers/MatchEventPublisher";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "../../../../shared/middleware/errorHandler";
import { MatchStatus, MatchType } from "../../../../shared/types";

export class MatchService {
  private eventPublisher: MatchEventPublisher;

  constructor() {
    this.eventPublisher = new MatchEventPublisher();
  }

  async createMatch(userId: string, matchData: any) {
    // Validate schedule date is in the future
    const scheduledDate = new Date(matchData.schedule.date);
    if (scheduledDate <= new Date()) {
      throw new ValidationError("Match date must be in the future");
    }

    const match = new Match({
      type: matchData.type || MatchType.PUBLIC,
      sport: matchData.sport.trim(),
      schedule: {
        ...matchData.schedule,
        date: scheduledDate,
      },
      venue: matchData.venue,
      rules: matchData.rules || {},
      createdBy: userId,
      participants: [userId],
      status: MatchStatus.UPCOMING,
      maxParticipants:
        matchData.maxParticipants ||
        (matchData.type === MatchType.PRIVATE ? 2 : 10),
    });

    await match.save();
    await match.populate([
      { path: "createdBy", select: "profile" },
      { path: "participants", select: "profile" },
      { path: "venue", select: "name location" },
    ]);

    // Publish event
    this.eventPublisher.publishMatchCreated({
      matchId: match.id,
      createdBy: userId,
      sport: match.sport,
      scheduledDate: match.schedule.date,
      type: match.type,
    });

    return match;
  }

  async joinMatch(userId: string, matchId: string) {
    const match = await Match.findById(matchId);

    if (!match) {
      throw new NotFoundError("Match");
    }

    if (match.status !== MatchStatus.UPCOMING) {
      throw new ConflictError("Cannot join match that is not upcoming");
    }

    if (match.participants.includes(userId as any)) {
      throw new ConflictError("Already participating in this match");
    }

    if (
      (match as any).maxParticipants &&
      match.participants.length >= (match as any).maxParticipants
    ) {
      throw new ConflictError("Match is full");
    }

    match.participants.push(userId as any);
    await match.save();

    // Publish event
    this.eventPublisher.publishPlayerJoined({
      matchId: match.id,
      userId,
      sport: match.sport,
    });

    await match.populate("participants", "profile");
    return match;
  }

  async leaveMatch(userId: string, matchId: string) {
    const match = await Match.findById(matchId);

    if (!match) {
      throw new NotFoundError("Match");
    }

    if (!match.participants.includes(userId as any)) {
      throw new ConflictError("Not participating in this match");
    }

    if (match.createdBy.toString() === userId) {
      throw new ConflictError("Match creator cannot leave the match");
    }

    if (match.status === MatchStatus.ONGOING) {
      throw new ConflictError("Cannot leave match that is ongoing");
    }

    match.participants = match.participants.filter(
      (p) => p.toString() !== userId
    );
    await match.save();

    // Publish event
    this.eventPublisher.publishPlayerLeft({
      matchId: match.id,
      userId,
    });

    return { success: true };
  }

  async updateMatchStatus(
    matchId: string,
    status: MatchStatus,
    userId: string
  ) {
    const match = await Match.findById(matchId);

    if (!match) {
      throw new NotFoundError("Match");
    }

    if (match.createdBy.toString() !== userId) {
      throw new ValidationError("Only match creator can update status");
    }

    match.status = status;
    await match.save();

    // Publish event based on status
    if (status === MatchStatus.COMPLETED) {
      this.eventPublisher.publishMatchCompleted({
        matchId: match.id,
        winnerId: match.winner?.toString(),
        participants: match.participants.map((p) => p.toString()),
        sport: match.sport,
      });
    } else if (status === MatchStatus.CANCELLED) {
      this.eventPublisher.publishMatchCancelled({
        matchId: match.id,
        reason: "Cancelled by creator",
      });
    }

    return match;
  }

  async updateScore(
    userId: string,
    matchId: string,
    scores: any,
    winner?: string
  ) {
    const match = await Match.findById(matchId);

    if (!match) {
      throw new NotFoundError("Match");
    }

    if (!match.participants.includes(userId as any)) {
      throw new ValidationError("Only participants can update scores");
    }

    match.scores = scores;
    if (winner) {
      match.winner = winner as any;
      match.status = MatchStatus.COMPLETED;

      // Publish match completed event
      this.eventPublisher.publishMatchCompleted({
        matchId: match.id,
        winnerId: winner,
        participants: match.participants.map((p) => p.toString()),
        sport: match.sport,
      });
    }

    await match.save();
    return match;
  }
}
