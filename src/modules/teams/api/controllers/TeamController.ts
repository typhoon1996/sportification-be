import { Request, Response } from 'express';
import { TeamService } from '../../domain/services/TeamService';
import { sendSuccess, sendCreated, asyncHandler } from '../../../../shared/middleware/errorHandler';
import { AuthRequest } from '../../../../shared/middleware/auth';
import { validatePagination } from '../../../../shared/middleware/validation';
import { Team } from '../../domain/models/Team';
import logger from '../../../../shared/infrastructure/logging';

/**
 * TeamController - Handles team management HTTP requests
 * 
 * This controller manages sports teams including creation, membership management,
 * and team operations. Teams allow users to form organized groups for matches
 * and tournaments.
 * 
 * Features:
 * - Team CRUD operations
 * - Membership management (join/leave)
 * - Team discovery and search
 * - Captain permissions
 * 
 * Team Roles:
 * - Captain: Creator of the team, has full permissions
 * - Members: Regular team members, can participate in team activities
 * 
 * @class TeamController
 */
export class TeamController {
  private teamService: TeamService;

  /**
   * Initializes the TeamController with required services
   * Creates a new instance of TeamService for handling team operations
   */
  constructor() {
    this.teamService = new TeamService();
  }

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
      throw new Error('User not authenticated');
    }
    return req.userId;
  }

  /**
   * Create a new team
   * 
   * Creates a sports team with the authenticated user as captain.
   * The creator is automatically added as a team member and has full permissions
   * to manage the team.
   * 
   * Business Rules:
   * - Creator automatically becomes team captain
   * - Creator is automatically a team member
   * - Team names should be unique within the same sport (not enforced at DB level)
   * 
   * @async
   * @param {AuthRequest} req - Authenticated request with team data
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 201 Created with team details
   * 
   * @requires Authentication - User must be authenticated
   * 
   * @throws {ValidationError} If required fields are missing
   * 
   * @example
   * POST /api/v1/teams
   * Body: {
   *   name: "Thunder Strikers",
   *   sport: "football",
   *   description: "Competitive football team",
   *   maxMembers: 20
   * }
   */
  createTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const team = await this.teamService.createTeam(userId, req.body);

    await team.populate([
      { path: 'captain', select: 'profile' },
      { path: 'members', select: 'profile' },
    ]);

    logger.info(`Team created by user: ${userId}`, {
      teamId: team.id,
      name: team.name,
    });

    sendCreated(res, { team }, 'Team created successfully');
  });

  /**
   * Get all teams with filtering and pagination
   * 
   * Retrieves a paginated list of active teams. Supports filtering by sport
   * and searching by team name. Only active teams are returned.
   * 
   * @async
   * @param {Request} req - Express request with query parameters
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with paginated team list
   * 
   * Query Parameters:
   * - page: Page number (default: 1)
   * - limit: Results per page (default: 10)
   * - sport: Filter by sport type (case-insensitive)
   * - search: Search by team name (case-insensitive)
   * 
   * @example
   * GET /api/v1/teams?sport=football&search=striker&page=1
   */
  getTeams = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );

    const filter: any = { status: 'active' };

    // Apply optional filters
    if (req.query.sport) {
      filter.sport = new RegExp(req.query.sport as string, 'i');
    }
    if (req.query.search) {
      filter.name = new RegExp(req.query.search as string, 'i');
    }

    // Execute query and count in parallel for better performance
    const [teams, total] = await Promise.all([
      Team.find(filter)
        .populate('captain', 'profile')
        .populate('members', 'profile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Team.countDocuments(filter),
    ]);

    sendSuccess(res, {
      teams,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  /**
   * Get team by ID
   * 
   * Retrieves detailed information about a specific team including
   * captain, members, and team statistics.
   * 
   * @async
   * @param {Request} req - Express request with team ID parameter
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with team details
   * 
   * @throws {Error} If team doesn't exist
   * 
   * @example
   * GET /api/v1/teams/507f1f77bcf86cd799439011
   */
  getTeamById = asyncHandler(async (req: Request, res: Response) => {
    const team = await Team.findById(req.params.id)
      .populate('captain', 'profile')
      .populate('members', 'profile');

    if (!team) {
      throw new Error('Team not found');
    }

    sendSuccess(res, { team });
  });

  /**
   * Join a team
   * 
   * Adds the authenticated user as a member of the team. For private teams,
   * this may create a join request instead of immediately adding the user.
   * Users cannot join a team if they're already a member.
   * 
   * Business Rules:
   * - User cannot join if already a member
   * - Team cannot exceed maxMembers limit
   * - Private teams may require approval (handled in service layer)
   * 
   * @async
   * @param {AuthRequest} req - Authenticated request with team ID parameter
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with updated team details
   * 
   * @requires Authentication - User must be authenticated
   * 
   * @throws {Error} If team doesn't exist
   * @throws {ConflictError} If user is already a member or team is full
   * 
   * @example
   * POST /api/v1/teams/507f1f77bcf86cd799439011/join
   */
  joinTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const team = await this.teamService.joinTeam(userId, req.params.id as string);

    await team.populate('members', 'profile');

    sendSuccess(res, { team }, 'Successfully joined the team');
  });

  /**
   * Leave a team
   * 
   * Removes the authenticated user from the team's member list.
   * Team captains cannot leave their own team - they must transfer
   * captaincy first or delete the team.
   * 
   * Business Rules:
   * - Captain cannot leave (must transfer or delete team)
   * - User must be a member to leave
   * 
   * @async
   * @param {AuthRequest} req - Authenticated request with team ID parameter
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with success message
   * 
   * @requires Authentication - User must be authenticated and be a team member
   * 
   * @throws {Error} If team doesn't exist or user is not a member
   * @throws {ConflictError} If user is the team captain
   * 
   * @example
   * POST /api/v1/teams/507f1f77bcf86cd799439011/leave
   */
  leaveTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    await this.teamService.leaveTeam(userId, req.params.id as string);

    sendSuccess(res, null, 'Successfully left the team');
  });

  /**
   * Update team information
   * 
   * Updates team details such as name, description, or maxMembers.
   * Only the team captain can update team information.
   * 
   * Updatable Fields:
   * - name: Team name
   * - description: Team description
   * - maxMembers: Maximum member capacity
   * - isPrivate: Privacy setting
   * 
   * @async
   * @param {AuthRequest} req - Authenticated request with team ID and update data
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with updated team details
   * 
   * @requires Authentication - User must be authenticated and be team captain
   * 
   * @throws {Error} If team doesn't exist
   * @throws {ForbiddenError} If user is not the team captain
   * 
   * @example
   * PATCH /api/v1/teams/507f1f77bcf86cd799439011
   * Body: {
   *   name: "Updated Team Name",
   *   maxMembers: 25
   * }
   */
  updateTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const team = await this.teamService.updateTeam(req.params.id as string, userId, req.body);

    await team.populate([
      { path: 'captain', select: 'profile' },
      { path: 'members', select: 'profile' },
    ]);

    logger.info(`Team updated by user: ${userId}`, {
      teamId: team.id,
    });

    sendSuccess(res, { team }, 'Team updated successfully');
  });

  /**
   * Delete a team
   * 
   * Permanently deletes a team from the system. Only the team captain or
   * administrators can delete a team. All team data and membership records
   * are removed.
   * 
   * Business Rules:
   * - Only captain or admin can delete
   * - Deletion is permanent and cannot be undone
   * - All associated data is removed
   * 
   * @async
   * @param {AuthRequest} req - Authenticated request with team ID parameter
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with success message
   * 
   * @requires Authentication - User must be authenticated and be team captain
   * 
   * @throws {Error} If team doesn't exist
   * @throws {ForbiddenError} If user is not the team captain
   * 
   * @example
   * DELETE /api/v1/teams/507f1f77bcf86cd799439011
   */
  deleteTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    await this.teamService.deleteTeam(req.params.id as string, userId);

    logger.info(`Team deleted by user: ${userId}`, {
      teamId: req.params.id,
    });

    sendSuccess(res, null, 'Team deleted successfully');
  });
}

/**
 * Singleton instance of TeamController
 * Exported for use in route definitions
 * @const {TeamController}
 */
export const teamController = new TeamController();
