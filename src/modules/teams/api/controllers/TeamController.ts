import { Request, Response } from 'express';
import { TeamService } from '../../domain/services/TeamService';
import { sendSuccess, sendCreated, asyncHandler } from '../../../../shared/middleware/errorHandler';
import { AuthRequest } from '../../../../shared/middleware/auth';
import { validatePagination } from '../../../../shared/middleware/validation';
import { Team } from '../../domain/models/Team';
import logger from '../../../../shared/infrastructure/logging';

export class TeamController {
  private teamService: TeamService;

  constructor() {
    this.teamService = new TeamService();
  }

  private getUserId(req: AuthRequest): string {
    if (!req.userId) {
      throw new Error('User not authenticated');
    }
    return req.userId;
  }

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

  getTeams = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );

    const filter: any = { status: 'active' };

    if (req.query.sport) {
      filter.sport = new RegExp(req.query.sport as string, 'i');
    }
    if (req.query.search) {
      filter.name = new RegExp(req.query.search as string, 'i');
    }

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

  getTeamById = asyncHandler(async (req: Request, res: Response) => {
    const team = await Team.findById(req.params.id)
      .populate('captain', 'profile')
      .populate('members', 'profile');

    if (!team) {
      throw new Error('Team not found');
    }

    sendSuccess(res, { team });
  });

  joinTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const team = await this.teamService.joinTeam(userId, req.params.id as string);

    await team.populate('members', 'profile');

    sendSuccess(res, { team }, 'Successfully joined the team');
  });

  leaveTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    await this.teamService.leaveTeam(userId, req.params.id as string);

    sendSuccess(res, null, 'Successfully left the team');
  });

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

  deleteTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    await this.teamService.deleteTeam(req.params.id as string, userId);

    logger.info(`Team deleted by user: ${userId}`, {
      teamId: req.params.id,
    });

    sendSuccess(res, null, 'Team deleted successfully');
  });
}

export const teamController = new TeamController();
