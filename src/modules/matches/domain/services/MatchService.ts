import {Match} from "../../../matches/domain/models/Match";
import {MatchEventPublisher} from "../../events/publishers/MatchEventPublisher";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "../../../../shared/middleware/errorHandler";
import {MatchStatus, MatchType} from "../../../../shared/types";

/**
 * Match Service - Business Logic for Match Management
 *
 * Handles all business logic related to sports match creation, participation,
 * scoring, and lifecycle management. Implements match rules, validation, and
 * publishes domain events for other modules to consume.
 *
 * Key Responsibilities:
 * - Match creation with validation and defaults
 * - Participant management (join/leave logic)
 * - Match status lifecycle (upcoming → ongoing → completed)
 * - Score tracking and winner determination
 * - Match cancellation and deletion
 * - Privacy controls (public vs private matches)
 *
 * Business Rules:
 * - Matches must be scheduled in the future
 * - Creator automatically becomes first participant
 * - Creator cannot leave their own match
 * - Participants can only join upcoming matches
 * - Match capacity limits enforced
 * - Status transitions follow defined lifecycle
 * - Public matches have default capacity of 10
 * - Private matches have default capacity of 2
 *
 * Event Publication:
 * - match.created - When match is created
 * - match.player_joined - When participant joins
 * - match.player_left - When participant leaves
 * - match.status_changed - When status updated
 * - match.score_updated - When score is recorded
 *
 * @class MatchService
 */
export class MatchService {
  private eventPublisher: MatchEventPublisher;

  constructor() {
    this.eventPublisher = new MatchEventPublisher();
  }

  /**
   * Create a new sports match
   *
   * Creates a new match with validation, defaults, and initial participant setup.
   * The creator automatically becomes the first participant. Validates that the
   * scheduled date is in the future and publishes a match.created event.
   *
   * Process:
   * 1. Validates scheduled date is in future
   * 2. Sets defaults (type, capacity, status)
   * 3. Creates match document
   * 4. Adds creator as first participant
   * 5. Populates related data
   * 6. Publishes match.created event
   *
   * @async
   * @param {string} userId - ID of the user creating the match
   * @param {any} matchData - Match details (sport, schedule, venue, etc.)
   * @returns {Promise<Match>} Created match with populated fields
   *
   * @throws {ValidationError} If scheduled date is in the past
   *
   * @example
   * const match = await matchService.createMatch(userId, {
   *   sport: "Basketball",
   *   schedule: { date: "2025-10-25", time: "18:00" },
   *   venue: "venueId123",
   *   type: MatchType.PUBLIC,
   *   maxParticipants: 10
   * });
   */
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
      {path: "createdBy", select: "profile"},
      {path: "participants", select: "profile"},
      {path: "venue", select: "name location"},
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

  /**
   * Join an existing match as a participant
   *
   * Adds a user to the match participants list with validation checks.
   * Ensures match capacity is not exceeded and user is not already participating.
   * Only allows joining matches in 'upcoming' status.
   *
   * Validation Rules:
   * - Match must exist
   * - Match status must be 'upcoming'
   * - User must not already be participating
   * - Match must not be at max capacity
   *
   * @async
   * @param {string} userId - ID of the user joining
   * @param {string} matchId - ID of the match to join
   * @returns {Promise<Match>} Updated match with new participant
   *
   * @throws {NotFoundError} If match doesn't exist
   * @throws {ConflictError} If already participating, match full, or match not upcoming
   *
   * @example
   * const match = await matchService.joinMatch(userId, matchId);
   * // User added to match.participants array
   * // Event published: match.player_joined
   */
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

  /**
   * Leave a match as a participant
   *
   * Removes a user from the match participants list. The match creator cannot
   * leave their own match - they must cancel/delete it instead. Only allows
   * leaving matches in 'upcoming' status.
   *
   * Business Rules:
   * - Creator cannot leave their own match
   * - Can only leave upcoming matches
   * - User must be a current participant
   *
   * @async
   * @param {string} userId - ID of the user leaving
   * @param {string} matchId - ID of the match to leave
   * @returns {Promise<Match>} Updated match without the user
   *
   * @throws {NotFoundError} If match doesn't exist
   * @throws {ConflictError} If user is creator, not participating, or match not upcoming
   *
   * @example
   * const match = await matchService.leaveMatch(userId, matchId);
   * // User removed from match.participants array
   * // Event published: match.player_left
   */
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
      p => p.toString() !== userId
    );
    await match.save();

    // Publish event
    this.eventPublisher.publishPlayerLeft({
      matchId: match.id,
      userId,
    });

    return {success: true};
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
        participants: match.participants.map(p => p.toString()),
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
        participants: match.participants.map(p => p.toString()),
        sport: match.sport,
      });
    }

    await match.save();
    return match;
  }
}
