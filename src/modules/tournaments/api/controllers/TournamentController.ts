import {Request, Response} from "express";
import logger from "../../../../shared/infrastructure/logging";
import {AuthRequest} from "../../../../shared/middleware/auth";
import {
  sendSuccess,
  sendCreated,
  asyncHandler,
} from "../../../../shared/middleware/errorHandler";
import {
  validatePagination,
  validateSort,
} from "../../../../shared/middleware/validation";
import {Tournament} from "../../../tournaments/domain/models/Tournament";
import {TournamentService} from "../../domain/services/TournamentService";

/**
 * TournamentController - Handles tournament management HTTP requests
 *
 * This controller manages competitive tournaments including creation, bracket generation,
 * participant registration, and match progression. Supports various tournament formats
 * (single elimination, double elimination, round robin).
 *
 * Features:
 * - Tournament CRUD operations
 * - Automatic bracket generation
 * - Participant registration management
 * - Match progression and scoring
 * - Real-time bracket updates
 * - Tournament statistics and leaderboards
 *
 * Tournament Lifecycle:
 * 1. Registration - Participants sign up
 * 2. Active - Tournament is ongoing with matches
 * 3. Completed - All matches finished, winner determined
 *
 * @class TournamentController
 */
export class TournamentController {
  private tournamentService: TournamentService;

  /**
   * Initializes the TournamentController with required services
   * Creates a new instance of TournamentService for handling tournament operations
   */
  constructor() {
    this.tournamentService = new TournamentService();
  }

  /**
   * Helper method to extract and validate user ID from authenticated request
   *
   * @private
   * @param {AuthRequest} req - Authenticated request object
   * @return {string} User ID from the authenticated request
   * @throws {Error} If user is not authenticated
   */
  private getUserId(req: AuthRequest): string {
    if (!req.userId) {
      throw new Error("User not authenticated");
    }
    return req.userId;
  }

  /**
   * Create a new tournament
   *
   * Creates a competitive tournament with bracket structure. The creator becomes
   * the tournament organizer with full management permissions. Supports various
   * tournament formats and automatically generates brackets once registration closes.
   *
   * Tournament Formats:
   * - single_elimination: One loss eliminates participant
   * - double_elimination: Participants get a second chance
   * - round_robin: Everyone plays everyone
   *
   * Business Rules:
   * - maxParticipants must be a power of 2 for elimination formats
   * - Start date must be in the future
   * - Creator becomes tournament organizer
   * - Initial status is "registration"
   *
   * @async
   * @param {AuthRequest} req - Authenticated request with tournament data
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 201 Created with tournament details
   *
   * @requires Authentication - User must be authenticated
   *
   * @throws {ValidationError} If maxParticipants is not power of 2 or date is invalid
   *
   * @example
   * POST /api/v1/tournaments
   * Body: {
   *   name: "Summer Championship 2025",
   *   sport: "football",
   *   format: "single_elimination",
   *   maxParticipants: 16,
   *   schedule: {
   *     startDate: "2025-06-15T10:00:00Z",
   *     endDate: "2025-06-20T18:00:00Z"
   *   },
   *   venue: "507f1f77bcf86cd799439011"
   * }
   */
  createTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const tournament = await this.tournamentService.createTournament(
      userId,
      req.body
    );

    await tournament.populate([
      {path: "organizer", select: "profile"},
      {path: "venue", select: "name location"},
    ]);

    logger.info(`Tournament created by user: ${userId}`, {
      tournamentId: tournament.id,
      name: tournament.name,
    });

    sendCreated(res, {tournament}, "Tournament created successfully");
  });

  /**
   * Get all tournaments with filtering and pagination
   *
   * Retrieves a paginated list of tournaments. Supports filtering by status,
   * sport, and format. Results are sorted by start date by default.
   *
   * @async
   * @param {Request} req - Express request with query parameters
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with paginated tournament list
   *
   * Query Parameters:
   * - page: Page number (default: 1)
   * - limit: Results per page (default: 10)
   * - status: Filter by status (registration, active, completed)
   * - sport: Filter by sport type (case-insensitive)
   * - format: Filter by tournament format
   * - sort: Sort field (default: -schedule.startDate)
   *
   * @example
   * GET /api/v1/tournaments?sport=football&status=active&page=1
   */
  getTournaments = asyncHandler(async (req: Request, res: Response) => {
    const {page, limit, skip} = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );
    const sort = validateSort(req.query.sort as string) || {
      "schedule.startDate": -1,
    };

    const filter: any = {};

    // Apply optional filters
    if (req.query.status) filter.status = req.query.status;
    if (req.query.sport)
      filter.sport = new RegExp(req.query.sport as string, "i");
    if (req.query.format) filter.format = req.query.format;

    // Execute query and count in parallel for better performance
    const [tournaments, total] = await Promise.all([
      Tournament.find(filter)
        .populate("organizer", "profile")
        .populate("venue", "name location")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Tournament.countDocuments(filter),
    ]);

    sendSuccess(res, {
      tournaments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  /**
   * Get tournament by ID
   *
   * Retrieves detailed information about a specific tournament including
   * organizer, participants, venue, bracket structure, and current standings.
   *
   * @async
   * @param {Request} req - Express request with tournament ID parameter
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with tournament details including bracket
   *
   * @throws {Error} If tournament doesn't exist
   *
   * @example
   * GET /api/v1/tournaments/507f1f77bcf86cd799439011
   */
  getTournamentById = asyncHandler(async (req: Request, res: Response) => {
    const tournament = await Tournament.findById(req.params.id)
      .populate("organizer", "profile")
      .populate("participants", "profile")
      .populate("venue", "name location")
      .populate("winner", "profile");

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    sendSuccess(res, {tournament});
  });

  joinTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const tournament = await this.tournamentService.joinTournament(
      userId,
      req.params.id as string
    );

    await tournament.populate("participants", "profile");

    sendSuccess(res, {tournament}, "Successfully joined the tournament");
  });

  leaveTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    await this.tournamentService.leaveTournament(
      userId,
      req.params.id as string
    );

    sendSuccess(res, null, "Successfully left the tournament");
  });

  startTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const tournament = await this.tournamentService.startTournament(
      req.params.id as string,
      userId
    );

    await tournament.populate([
      {path: "organizer", select: "profile"},
      {path: "participants", select: "profile"},
    ]);

    logger.info(`Tournament started by user: ${userId}`, {
      tournamentId: tournament.id,
    });

    sendSuccess(res, {tournament}, "Tournament started successfully");
  });

  updateTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const tournament = await this.tournamentService.updateTournament(
      req.params.id as string,
      userId,
      req.body
    );

    await tournament.populate([
      {path: "organizer", select: "profile"},
      {path: "participants", select: "profile"},
    ]);

    logger.info(`Tournament updated by user: ${userId}`, {
      tournamentId: tournament.id,
    });

    sendSuccess(res, {tournament}, "Tournament updated successfully");
  });

  deleteTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    await this.tournamentService.deleteTournament(
      req.params.id as string,
      userId
    );

    logger.info(`Tournament deleted by user: ${userId}`, {
      tournamentId: req.params.id,
    });

    sendSuccess(res, null, "Tournament deleted successfully");
  });
}

export const tournamentController = new TournamentController();
