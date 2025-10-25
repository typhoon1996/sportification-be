import {Match} from "../../../matches/domain/models/Match";
import {IMatch} from "../../../../shared/types";
import {MatchEventPublisher} from "../../events/publishers/MatchEventPublisher";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "../../../../shared/middleware/errorHandler";
import {MatchStatus, MatchType} from "../../../../shared/types";
import {
  IMatchService,
  IMatchValidationService,
  IMatchParticipantService,
  IMatchEventPublisher,
  IMatchData,
} from "../interfaces";
import {MatchValidationService} from "./MatchValidationService";
import {MatchParticipantService} from "./MatchParticipantService";

/**
 * Match Service - Business Logic for Match Management (Refactored with SOLID principles)
 *
 * Orchestrates match operations by delegating to specialized services.
 * Follows Single Responsibility Principle - only handles orchestration and coordination.
 *
 * Architecture:
 * - Uses Dependency Injection for all services
 * - Delegates validation to MatchValidationService
 * - Delegates participant management to MatchParticipantService
 * - Depends on abstractions (interfaces), not concrete implementations
 *
 * Key Responsibilities:
 * - Orchestrate match creation workflow
 * - Coordinate participant operations
 * - Manage match lifecycle transitions
 * - Handle database operations
 *
 * Business Rules (enforced by specialized services):
 * - Matches must be scheduled in the future
 * - Creator automatically becomes first participant
 * - Creator cannot leave their own match
 * - Participants can only join upcoming matches
 * - Match capacity limits enforced
 * - Status transitions follow defined lifecycle
 * - Public matches have default capacity of 10
 * - Private matches have default capacity of 2
 *
 * @class MatchService
 * @implements {IMatchService}
 */
export class MatchService implements IMatchService {
  private validationService: IMatchValidationService;
  private participantService: IMatchParticipantService;
  private eventPublisher: IMatchEventPublisher;

  /**
   * Creates an instance of MatchService with dependency injection
   *
   * @param validationService - Optional validation service (defaults to MatchValidationService)
   * @param participantService - Optional participant service (defaults to MatchParticipantService)
   * @param eventPublisher - Optional event publisher (defaults to MatchEventPublisher)
   */
  constructor(
    validationService?: IMatchValidationService,
    participantService?: IMatchParticipantService,
    eventPublisher?: IMatchEventPublisher
  ) {
    // DI with default implementations
    this.validationService = validationService || new MatchValidationService();
    this.participantService =
      participantService || new MatchParticipantService();
    this.eventPublisher = eventPublisher || new MatchEventPublisher();
  }

  /**
   * Create a new sports match
   *
   * Creates a new match with validation, defaults, and initial participant setup.
   * The creator automatically becomes the first participant. Delegates validation
   * to MatchValidationService and publishes a match.created event.
   *
   * Process:
   * 1. Delegates schedule validation to validation service
   * 2. Sets defaults (type, capacity, status)
   * 3. Creates match document
   * 4. Adds creator as first participant
   * 5. Populates related data
   * 6. Publishes match.created event
   *
   * @async
   * @param {string} userId - ID of the user creating the match
   * @param {any} matchData - Match details (sport, schedule, venue, etc.)
   * @returns {Promise<IMatch>} Created match with populated fields
   *
   * @throws {ValidationError} If scheduled date is in the past
   *
   * @example
   * const match = await matchService.createMatch(userId, {
   *   sport: "Basketball",
   *   schedule: { date: "2025-10-25", time: "18:00" },
   *   venue: "venueId123",
   *   type: IMatchType.PUBLIC,
   *   maxParticipants: 10
   * });
   */
  async createMatch(userId: string, matchData: any) {
    // Delegate validation to validation service (DIP)
    this.validationService.validateSchedule(matchData.schedule);

    const scheduledDate = new Date(matchData.schedule.date);

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
   * Delegates validation to MatchValidationService and participant management
   * to MatchParticipantService following SRP.
   *
   * Validation Rules (enforced by MatchValidationService):
   * - Match must exist
   * - Match status must be 'upcoming'
   * - User must not already be participating
   * - Match must not be at max capacity
   *
   * @async
   * @param {string} userId - ID of the user joining
   * @param {string} matchId - ID of the match to join
   * @returns {Promise<IMatch>} Updated match with new participant
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

    // Delegate validation to validation service (DIP)
    this.validationService.validateCanJoin(match, userId);

    // Delegate participant management to participant service (DIP)
    return this.participantService.addParticipant(match, userId);
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
   * @returns {Promise<IMatch>} Updated match without the user
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

    // Delegate validation to validation service (DIP)
    this.validationService.validateCanLeave(match, userId);

    // Delegate participant management to participant service (DIP)
    return this.participantService.removeParticipant(match, userId);
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

  /**
   * Get match by ID
   */
  async getMatchById(matchId: string): Promise<IMatch> {
    const match = await Match.findById(matchId)
      .populate('createdBy', 'profile')
      .populate('participants', 'profile')
      .populate('venue', 'name location')
      .exec();

    if (!match) {
      throw new NotFoundError('Match');
    }

    return match;
  }

  /**
   * Cancel match
   */
  async cancelMatch(matchId: string, userId: string): Promise<IMatch> {
    const match = await Match.findById(matchId);

    if (!match) {
      throw new NotFoundError('Match');
    }

    if (match.createdBy.toString() !== userId) {
      throw new ValidationError('Only match creator can cancel');
    }

    if (match.status === MatchStatus.COMPLETED) {
      throw new ConflictError('Cannot cancel completed match');
    }

    match.status = MatchStatus.CANCELLED;
    await match.save();

    this.eventPublisher.publishMatchCancelled({
      matchId: match.id,
      reason: 'Cancelled by creator',
    });

    return match;
  }

  /**
   * Delete match
   */
  async deleteMatch(matchId: string, userId: string): Promise<void> {
    const match = await Match.findById(matchId);

    if (!match) {
      throw new NotFoundError('Match');
    }

    if (match.createdBy.toString() !== userId) {
      throw new ValidationError('Only match creator can delete');
    }

    if (match.status !== MatchStatus.CANCELLED) {
      throw new ConflictError('Only cancelled matches can be deleted');
    }

    await Match.findByIdAndDelete(matchId);
  }
}
