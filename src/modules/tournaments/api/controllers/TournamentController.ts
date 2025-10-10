import { Request, Response } from 'express';
import { TournamentService } from '../../domain/services/TournamentService';
import { sendSuccess, sendCreated, asyncHandler } from '../../../../shared/middleware/errorHandler';
import { AuthRequest } from '../../../../shared/middleware/auth';
import { validatePagination, validateSort } from '../../../../shared/middleware/validation';
import { Tournament } from '../../../tournaments/domain/models/Tournament';
import logger from '../../../../shared/utils/logger';

export class TournamentController {
  private tournamentService: TournamentService;

  constructor() {
    this.tournamentService = new TournamentService();
  }

  private getUserId(req: AuthRequest): string {
    if (!req.userId) {
      throw new Error('User not authenticated');
    }
    return req.userId;
  }

  createTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const tournament = await this.tournamentService.createTournament(userId, req.body);

    await tournament.populate([
      { path: 'organizer', select: 'profile' },
      { path: 'venue', select: 'name location' },
    ]);

    logger.info(`Tournament created by user: ${userId}`, {
      tournamentId: tournament.id,
      name: tournament.name,
    });

    sendCreated(res, { tournament }, 'Tournament created successfully');
  });

  getTournaments = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );
    const sort = validateSort(req.query.sort as string) || {
      'schedule.startDate': -1,
    };

    const filter: any = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.sport) filter.sport = new RegExp(req.query.sport as string, 'i');
    if (req.query.format) filter.format = req.query.format;

    const [tournaments, total] = await Promise.all([
      Tournament.find(filter)
        .populate('organizer', 'profile')
        .populate('venue', 'name location')
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

  getTournamentById = asyncHandler(async (req: Request, res: Response) => {
    const tournament = await Tournament.findById(req.params.id)
      .populate('organizer', 'profile')
      .populate('participants', 'profile')
      .populate('venue', 'name location')
      .populate('winner', 'profile');

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    sendSuccess(res, { tournament });
  });

  joinTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const tournament = await this.tournamentService.joinTournament(userId, req.params.id as string);

    await tournament.populate('participants', 'profile');

    sendSuccess(res, { tournament }, 'Successfully joined the tournament');
  });

  leaveTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    await this.tournamentService.leaveTournament(userId, req.params.id as string);

    sendSuccess(res, null, 'Successfully left the tournament');
  });

  startTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const tournament = await this.tournamentService.startTournament(
      req.params.id as string,
      userId
    );

    await tournament.populate([
      { path: 'organizer', select: 'profile' },
      { path: 'participants', select: 'profile' },
    ]);

    logger.info(`Tournament started by user: ${userId}`, {
      tournamentId: tournament.id,
    });

    sendSuccess(res, { tournament }, 'Tournament started successfully');
  });

  updateTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const tournament = await this.tournamentService.updateTournament(
      req.params.id as string,
      userId,
      req.body
    );

    await tournament.populate([
      { path: 'organizer', select: 'profile' },
      { path: 'participants', select: 'profile' },
    ]);

    logger.info(`Tournament updated by user: ${userId}`, {
      tournamentId: tournament.id,
    });

    sendSuccess(res, { tournament }, 'Tournament updated successfully');
  });

  deleteTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    await this.tournamentService.deleteTournament(req.params.id as string, userId);

    logger.info(`Tournament deleted by user: ${userId}`, {
      tournamentId: req.params.id,
    });

    sendSuccess(res, null, 'Tournament deleted successfully');
  });
}

export const tournamentController = new TournamentController();
