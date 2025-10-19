import {Request, Response} from "express";
import {Match} from "../../../matches/domain/models/Match";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  sendSuccess,
  sendCreated,
  asyncHandler,
} from "../../../../shared/middleware/errorHandler";
import {AuthRequest} from "../../../../shared/middleware/auth";
import {
  validatePagination,
  validateSort,
} from "../../../../shared/middleware/validation";
import {MatchStatus, MatchType} from "../../../../shared/types";

/**
 * MatchController - Handles all match-related HTTP requests
 * 
 * This controller manages the complete lifecycle of sports matches including creation,
 * participation management, scoring, status updates, and retrieval. It enforces
 * business rules around match participation, privacy, and state transitions.
 * 
 * Key Features:
 * - Match CRUD operations with proper authorization
 * - Public/Private match visibility controls
 * - Participant management (join/leave)
 * - Real-time score updates
 * - Status lifecycle management (upcoming → ongoing → completed)
 * - Filtering and pagination support
 * 
 * @class MatchController
 */
export class MatchController {
  /**
   * Helper method to extract and validate user ID from authenticated request
   * 
   * @private
   * @param {AuthRequest} req - Authenticated request object
   * @returns {string} User ID from the authenticated request
   * @throws {Error} If user is not authenticated
   */
  private getUserId(req: AuthRequest): string {
    if (!req.userId) {
      throw new Error("User not authenticated");
    }
    return req.userId;
  }

  /**
   * Create a new match
   * 
   * Creates a sports match with specified details. The creator is automatically
   * added as a participant. Validates that the match date is in the future.
   * Sets default values for maxParticipants based on match type (private: 2, public: 10).
   * 
   * Business Rules:
   * - Match date must be in the future
   * - Creator is automatically a participant
   * - Default maxParticipants: 2 for private, 10 for public
   * - Initial status is always UPCOMING
   * 
   * @async
   * @param {AuthRequest} req - Authenticated request with match data
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 201 Created with match details
   * 
   * @requires Authentication - User must be authenticated
   * 
   * @throws {ValidationError} If match date is not in the future
   * @throws {ValidationError} If required fields are missing
   * 
   * @example
   * POST /api/v1/matches
   * Body: {
   *   sport: "football",
   *   schedule: { date: "2025-10-20", time: "18:00" },
   *   venue: "507f1f77bcf86cd799439011",
   *   type: "public",
   *   maxParticipants: 10
   * }
   */
  createMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {type, sport, schedule, venue, rules, maxParticipants} = req.body;

    // Validate schedule date is in the future
    const scheduledDate = new Date(schedule.date);
    if (scheduledDate <= new Date()) {
      throw new ValidationError("Match date must be in the future");
    }

    const match = new Match({
      type: type || MatchType.PUBLIC,
      sport: sport.trim(),
      schedule: {
        ...schedule,
        date: scheduledDate,
      },
      venue,
      rules: rules || {},
      createdBy: req.userId,
      participants: [req.userId], // Creator is automatically a participant
      status: MatchStatus.UPCOMING,
      maxParticipants: maxParticipants || (type === MatchType.PRIVATE ? 2 : 10),
    });

    await match.save();
    // Populate related data for response
    await match.populate([
      {path: "createdBy", select: "profile"},
      {path: "participants", select: "profile"},
      {path: "venue", select: "name location"},
    ]);

    sendCreated(res, {match}, "Match created successfully");
  });

  /**
   * Get all matches with filtering and pagination
   * 
   * Retrieves a paginated list of matches with support for multiple filters.
   * Enforces privacy rules: only public matches or matches the user is part of are returned.
   * Supports filtering by type, status, sport, venue, and date range.
   * 
   * Privacy Rules:
   * - Anonymous users: Only public matches
   * - Authenticated users: Public matches + their private matches
   * 
   * @async
   * @param {Request} req - Express request with query parameters
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with paginated match list
   * 
   * Query Parameters:
   * - page: Page number (default: 1)
   * - limit: Results per page (default: 10)
   * - type: Filter by match type (public/private)
   * - status: Filter by status (upcoming/ongoing/completed)
   * - sport: Filter by sport name (case-insensitive)
   * - venue: Filter by venue ID
   * - fromDate: Filter matches from this date
   * - toDate: Filter matches until this date
   * - sort: Sort field (default: -schedule.date)
   * 
   * @example
   * GET /api/v1/matches?sport=football&status=upcoming&page=1&limit=20
   */
  getMatches = asyncHandler(async (req: Request, res: Response) => {
    const {page, limit, skip} = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );
    const sort = validateSort(req.query.sort as string) || {
      "schedule.date": -1,
    };

    const filter: any = {};

    // Apply various filters based on query parameters
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.sport)
      filter.sport = new RegExp(req.query.sport as string, "i");
    if (req.query.venue) filter.venue = req.query.venue;

    // Date range filter for finding matches within a specific timeframe
    if (req.query.fromDate || req.query.toDate) {
      filter["schedule.date"] = {};
      if (req.query.fromDate)
        filter["schedule.date"].$gte = new Date(req.query.fromDate as string);
      if (req.query.toDate)
        filter["schedule.date"].$lte = new Date(req.query.toDate as string);
    }

    // Privacy filter: Only show public matches or matches the user is participating in
    if (req.user) {
      filter.$or = [
        {type: MatchType.PUBLIC},
        {participants: req.userId},
        {createdBy: req.userId},
      ];
    } else {
      filter.type = MatchType.PUBLIC;
    }

    // Execute query and count in parallel for better performance
    const [matches, total] = await Promise.all([
      Match.find(filter)
        .populate("createdBy", "profile")
        .populate("participants", "profile")
        .populate("venue", "name location")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Match.countDocuments(filter),
    ]);

    sendSuccess(res, {
      matches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  /**
   * Get match by ID
   * 
   * Retrieves detailed information about a specific match including all participants,
   * venue details, and match statistics. Enforces privacy rules for private matches.
   * 
   * Privacy Rules:
   * - Public matches: Visible to all
   * - Private matches: Only visible to participants and creator
   * 
   * @async
   * @param {Request} req - Express request with match ID parameter
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with match details
   * 
   * @throws {NotFoundError} If match doesn't exist or user cannot view private match
   * 
   * @example
   * GET /api/v1/matches/507f1f77bcf86cd799439011
   */
  getMatchById = asyncHandler(async (req: Request, res: Response) => {
    const match = await Match.findById(req.params.id)
      .populate("createdBy", "profile")
      .populate("participants", "profile")
      .populate("venue", "name location surfaceType")
      .populate("winner", "profile");

    if (!match) {
      throw new NotFoundError("Match");
    }

    // Privacy check: Verify user can view private matches
    if (match.type === MatchType.PRIVATE && req.user) {
      const canView =
        match.participants.some((p: any) => p._id.toString() === req.userId) ||
        match.createdBy._id.toString() === req.userId;
      if (!canView) {
        throw new NotFoundError("Match");
      }
    } else if (match.type === MatchType.PRIVATE && !req.user) {
      throw new NotFoundError("Match");
    }

    sendSuccess(res, {match});
  });

  /**
   * Join a match
   * 
   * Adds the authenticated user as a participant to an upcoming match.
   * Validates that the match is not full and user is not already participating.
   * 
   * Business Rules:
   * - Can only join UPCOMING matches
   * - Cannot join if already a participant
   * - Cannot join if match is at maxParticipants capacity
   * 
   * @async
   * @param {AuthRequest} req - Authenticated request with match ID parameter
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with updated match details
   * 
   * @requires Authentication - User must be authenticated
   * 
   * @throws {NotFoundError} If match doesn't exist
   * @throws {ConflictError} If match is not upcoming, user already participating, or match is full
   * 
   * @example
   * POST /api/v1/matches/507f1f77bcf86cd799439011/join
   */
  joinMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const match = await Match.findById(req.params.id);

    if (!match) {
      throw new NotFoundError("Match");
    }

    // Validate match is in correct state to accept new participants
    if (match.status !== MatchStatus.UPCOMING) {
      throw new ConflictError("Cannot join match that is not upcoming");
    }

    // Check if user is already a participant
    if ((match as any).isParticipant(req.userId)) {
      throw new ConflictError("Already participating in this match");
    }

    // Check if match has reached maximum participant limit
    const maxParticipants = (match as any).maxParticipants;
    if (maxParticipants && match.participants.length >= maxParticipants) {
      throw new ConflictError("Match is full");
    }

    // Add user as participant using model method
    (match as any).addParticipant(req.userId);
    await match.save();

    await match.populate("participants", "profile");

    sendSuccess(res, {match}, "Successfully joined the match");
  });

  /**
   * Leave a match
   * 
   * Removes the authenticated user from a match's participants list.
   * The match creator cannot leave their own match.
   * 
   * Business Rules:
   * - User must be a participant
   * - Creator cannot leave their own match
   * - Cannot leave ongoing matches
   * 
   * @async
   * @param {AuthRequest} req - Authenticated request with match ID parameter
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with success message
   * 
   * @requires Authentication - User must be authenticated
   * 
   * @throws {NotFoundError} If match doesn't exist
   * @throws {ConflictError} If user is not a participant, is the creator, or match is ongoing
   * 
   * @example
   * POST /api/v1/matches/507f1f77bcf86cd799439011/leave
   */
  leaveMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const match = await Match.findById(req.params.id);

    if (!match) {
      throw new NotFoundError("Match");
    }

    // Verify user is currently a participant
    if (!(match as any).isParticipant(req.userId)) {
      throw new ConflictError("Not participating in this match");
    }

    // Match creator cannot leave - they must cancel the match instead
    if ((match as any).isCreator(req.userId)) {
      throw new ConflictError("Match creator cannot leave the match");
    }

    // Cannot leave matches that are currently in progress
    if (match.status === MatchStatus.ONGOING) {
      throw new ConflictError("Cannot leave match that is ongoing");
    }

    // Remove user from participants using model method
    (match as any).removeParticipant(req.userId);
    await match.save();

    sendSuccess(res, null, "Successfully left the match");
  });

  /**
   * Update match score
   * 
   * Updates the score for an ongoing match and optionally sets a winner.
   * Only participants and the match creator can update scores.
   * Setting a winner automatically transitions the match to COMPLETED status.
   * 
   * Business Rules:
   * - Only participants or creator can update scores
   * - Can only update scores for ONGOING matches
   * - Winner must be a participant in the match
   * - Setting a winner automatically completes the match
   * 
   * @async
   * @param {AuthRequest} req - Authenticated request with score data
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with updated match details
   * 
   * @requires Authentication - User must be authenticated and be a participant/creator
   * 
   * @throws {NotFoundError} If match doesn't exist
   * @throws {ConflictError} If user is not authorized or match is not ongoing
   * @throws {ValidationError} If winner is not a participant
   * 
   * @example
   * PUT /api/v1/matches/507f1f77bcf86cd799439011/score
   * Body: {
   *   scores: { team1: 2, team2: 1 },
   *   winner: "507f1f77bcf86cd799439012"
   * }
   */
  updateScore = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {scores, winner} = req.body;
    const match = await Match.findById(req.params.id);

    if (!match) {
      throw new NotFoundError("Match");
    }

    // Verify user has permission to update scores
    const isParticipant = (match as any).isParticipant(req.userId);
    const isCreator = (match as any).isCreator(req.userId);

    if (!isParticipant && !isCreator) {
      throw new ConflictError("Only participants can update match scores");
    }

    // Can only update scores during active matches
    if (match.status !== MatchStatus.ONGOING) {
      throw new ConflictError("Can only update scores for ongoing matches");
    }

    match.scores = scores;
    if (winner) {
      // Verify winner is actually a participant
      if ((match as any).isParticipant(winner)) {
        match.winner = winner;
        match.status = MatchStatus.COMPLETED;
      } else {
        throw new ValidationError("Winner must be a participant in the match");
      }
    }

    await match.save();
    await match.populate([
      {path: "participants", select: "profile"},
      {path: "winner", select: "profile"},
      {path: "createdBy", select: "profile"},
    ]);

    sendSuccess(res, {match}, "Match score updated successfully");
  });

  /**
   * Update match status
   * 
   * Changes the status of a match through its lifecycle (upcoming → ongoing → completed).
   * Only the match creator or admins/moderators can update status.
   * Validates status transitions are valid according to the match lifecycle.
   * 
   * Valid Transitions:
   * - UPCOMING → ONGOING, EXPIRED, or CANCELLED
   * - ONGOING → COMPLETED or CANCELLED
   * - COMPLETED, EXPIRED, CANCELLED → No transitions (terminal states)
   * 
   * @async
   * @param {AuthRequest} req - Authenticated request with new status
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with updated match details
   * 
   * @requires Authentication - User must be match creator or admin/moderator
   * 
   * @throws {NotFoundError} If match doesn't exist
   * @throws {ConflictError} If user is not authorized
   * @throws {ValidationError} If status transition is invalid
   * 
   * @example
   * PUT /api/v1/matches/507f1f77bcf86cd799439011/status
   * Body: { status: "ongoing" }
   */
  updateMatchStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {status} = req.body;
    const match = await Match.findById(req.params.id);

    if (!match) {
      throw new NotFoundError("Match");
    }

    // Authorization check: Only creator or admin/moderator can update status
    if (!(match as any).isCreator(req.userId)) {
      const userRole = req.user?.role || "user";
      if (!["admin", "moderator"].includes(userRole)) {
        throw new ConflictError("Only match creator can update match status");
      }
    }

    // Define valid status transitions to enforce proper lifecycle
    const validTransitions: Record<MatchStatus, MatchStatus[]> = {
      [MatchStatus.UPCOMING]: [
        MatchStatus.ONGOING,
        MatchStatus.EXPIRED,
        MatchStatus.CANCELLED,
      ],
      [MatchStatus.ONGOING]: [MatchStatus.COMPLETED, MatchStatus.CANCELLED],
      [MatchStatus.COMPLETED]: [],
      [MatchStatus.EXPIRED]: [],
      [MatchStatus.CANCELLED]: [],
    };

    // Validate the requested status transition
    if (!validTransitions[match.status].includes(status as MatchStatus)) {
      throw new ValidationError(
        `Cannot transition from ${match.status} to ${status}`
      );
    }

    match.status = status;
    await match.save();

    await match.populate([
      {path: "participants", select: "profile"},
      {path: "createdBy", select: "profile"},
    ]);

    sendSuccess(res, {match}, "Match status updated successfully");
  });

  /**
   * Delete match
   * 
   * Permanently deletes a match from the system. This endpoint is restricted to
   * admin and moderator roles via route middleware. Cannot delete ongoing matches
   * to prevent disruption of active games.
   * 
   * Business Rules:
   * - Cannot delete ongoing matches
   * - Only admins/moderators can delete (enforced by route middleware)
   * 
   * @async
   * @param {AuthRequest} req - Authenticated request with match ID parameter
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with success message
   * 
   * @requires Authorization - Admin or Moderator role (enforced by route middleware)
   * 
   * @throws {NotFoundError} If match doesn't exist
   * @throws {ConflictError} If match is currently ongoing
   * 
   * @example
   * DELETE /api/v1/matches/507f1f77bcf86cd799439011
   */
  deleteMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const match = await Match.findById(req.params.id);

    if (!match) {
      throw new NotFoundError("Match");
    }

    // Prevent deletion of active matches
    if (match.status === MatchStatus.ONGOING) {
      throw new ConflictError("Cannot delete ongoing match");
    }

    await Match.findByIdAndDelete(req.params.id);

    sendSuccess(res, null, "Match deleted successfully");
  });

  /**
   * Get user's matches
   * 
   * Retrieves all matches a specific user has created or is participating in.
   * Results are paginated and can be filtered by status.
   * Sorted by most recent match date first.
   * 
   * @async
   * @param {Request} req - Express request with user ID parameter and query params
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with paginated match list
   * 
   * Query Parameters:
   * - page: Page number
   * - limit: Results per page
   * - status: Filter by match status
   * 
   * @example
   * GET /api/v1/matches/user/507f1f77bcf86cd799439011?status=upcoming&page=1
   */
  getUserMatches = asyncHandler(async (req: Request, res: Response) => {
    const {page, limit, skip} = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );
    const userId = req.params.userId;

    const filter: any = {
      $or: [{participants: userId}, {createdBy: userId}],
    };

    // Optional status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Execute query and count in parallel
    const [matches, total] = await Promise.all([
      Match.find(filter)
        .populate("createdBy", "profile")
        .populate("participants", "profile")
        .populate("venue", "name location")
        .sort({"schedule.date": -1})
        .skip(skip)
        .limit(limit),
      Match.countDocuments(filter),
    ]);

    sendSuccess(res, {
      matches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });
}

/**
 * Singleton instance of MatchController
 * Exported for use in route definitions
 * @const {MatchController}
 */
export const matchController = new MatchController();
