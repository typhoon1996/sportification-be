import { Request, Response } from 'express';
import { Tournament } from '../models/Tournament';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  sendSuccess,
  sendCreated,
  asyncHandler,
} from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { validatePagination, validateSort } from '../middleware/validation';
import { TournamentStatus } from '../types';

export class TournamentController {
  // Create a new tournament
  static createTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, description, startDate, endDate, maxParticipants, entryFee, prizes, rules } =
      req.body;

    // Validate start date is in the future
    const start = new Date(startDate);
    if (start <= new Date()) {
      throw new ValidationError('Tournament start date must be in the future');
    }

    const tournament = new Tournament({
      name: name.trim(),
      description: description?.trim(),
      startDate: start,
      endDate: endDate ? new Date(endDate) : undefined,
      maxParticipants: maxParticipants || 16,
      entryFee: entryFee || 0,
      prizes: prizes || {},
      rules: rules || {},
      createdBy: req.userId,
      participants: [req.userId], // Creator is automatically a participant
      status: TournamentStatus.UPCOMING,
      standings: [],
      matches: [],
      bracket: {},
    });

    await tournament.save();
    await tournament.populate('createdBy', 'profile');

    sendCreated(res, { tournament }, 'Tournament created successfully');
  });

  // Get all tournaments with filtering and pagination
  static getTournaments = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );
    const sort = validateSort(req.query.sort as string) || { startDate: -1 };

    const filter: any = {};

    // Apply filters
    if (req.query.status) filter.status = req.query.status;
    if (req.query.name) filter.name = new RegExp(req.query.name as string, 'i');

    // Date range filter
    if (req.query.fromDate || req.query.toDate) {
      filter.startDate = {};
      if (req.query.fromDate) filter.startDate.$gte = new Date(req.query.fromDate as string);
      if (req.query.toDate) filter.startDate.$lte = new Date(req.query.toDate as string);
    }

    const [tournaments, total] = await Promise.all([
      Tournament.find(filter)
        .populate('createdBy', 'profile')
        .populate('participants', 'profile')
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

  // Get tournament by ID
  static getTournamentById = asyncHandler(async (req: Request, res: Response) => {
    const tournament = await Tournament.findById(req.params.id)
      .populate('createdBy', 'profile')
      .populate('participants', 'profile')
      .populate('matches')
      .populate('standings', 'profile');

    if (!tournament) {
      throw new NotFoundError('Tournament');
    }

    sendSuccess(res, { tournament });
  });

  // Join a tournament
  static joinTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      throw new NotFoundError('Tournament');
    }

    if (tournament.status !== TournamentStatus.UPCOMING) {
      throw new ConflictError('Cannot join tournament that is not upcoming');
    }

    if (tournament.participants.includes(req.userId as any)) {
      throw new ConflictError('Already participating in this tournament');
    }

    if (tournament.isFull) {
      throw new ConflictError('Tournament is full');
    }

    tournament.participants.push(req.userId as any);
    await tournament.save();

    await tournament.populate('participants', 'profile');

    sendSuccess(res, { tournament }, 'Successfully joined the tournament');
  });

  // Leave a tournament
  static leaveTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      throw new NotFoundError('Tournament');
    }

    if (!tournament.participants.includes(req.userId as any)) {
      throw new ConflictError('Not participating in this tournament');
    }

    if (tournament.createdBy.toString() === req.userId) {
      throw new ConflictError('Tournament creator cannot leave the tournament');
    }

    if (tournament.status !== TournamentStatus.UPCOMING) {
      throw new ConflictError('Cannot leave tournament that has already started');
    }

    tournament.participants = tournament.participants.filter((p) => p.toString() !== req.userId);
    await tournament.save();

    sendSuccess(res, null, 'Successfully left the tournament');
  });

  // Start tournament (generates bracket)
  static startTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      throw new NotFoundError('Tournament');
    }

    // Only tournament creator can start
    if (tournament.createdBy.toString() !== req.userId) {
      throw new ConflictError('Only tournament creator can start the tournament');
    }

    if (tournament.status !== TournamentStatus.UPCOMING) {
      throw new ConflictError('Tournament is not in upcoming status');
    }

    if (!tournament.canStart) {
      throw new ConflictError('Tournament cannot be started yet (minimum 4 participants required)');
    }

    // Generate bracket and start tournament
    (tournament as any).startTournament();
    await tournament.save();

    await (tournament as any).populate(['participants', 'createdBy'], 'profile');

    sendSuccess(res, { tournament }, 'Tournament started successfully');
  });

  // Update tournament bracket (advance winner)
  static updateBracket = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { matchId, winnerId } = req.body;
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      throw new NotFoundError('Tournament');
    }

    if (tournament.status !== TournamentStatus.ONGOING) {
      throw new ConflictError('Tournament is not ongoing');
    }

    // Only tournament creator or participants can update bracket
    const isAuthorized =
      tournament.createdBy.toString() === req.userId ||
      tournament.participants.includes(req.userId as any);

    if (!isAuthorized) {
      throw new ConflictError('Only tournament participants or creator can update bracket');
    }

    try {
      (tournament as any).advanceBracket(matchId, winnerId);
      await tournament.save();

      await (tournament as any).populate(['participants', 'standings'], 'profile');

      sendSuccess(res, { tournament }, 'Tournament bracket updated successfully');
    } catch (error: any) {
      throw new ValidationError(error.message);
    }
  });

  // Get tournament bracket
  static getTournamentBracket = asyncHandler(async (req: Request, res: Response) => {
    const tournament = await Tournament.findById(req.params.id).select('bracket participants');

    if (!tournament) {
      throw new NotFoundError('Tournament');
    }

    await tournament.populate('participants', 'profile');

    sendSuccess(res, {
      bracket: tournament.bracket,
      participants: tournament.participants,
    });
  });

  // Get tournament standings
  static getTournamentStandings = asyncHandler(async (req: Request, res: Response) => {
    const tournament = await Tournament.findById(req.params.id)
      .select('standings participants status')
      .populate('standings', 'profile')
      .populate('participants', 'profile');

    if (!tournament) {
      throw new NotFoundError('Tournament');
    }

    const standings =
      tournament.standings.length > 0 ? tournament.standings : tournament.participants;

    sendSuccess(res, {
      standings,
      status: tournament.status,
    });
  });

  // Update tournament details
  static updateTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      throw new NotFoundError('Tournament');
    }

    // Only tournament creator can update
    if (tournament.createdBy.toString() !== req.userId) {
      throw new ConflictError('Only tournament creator can update tournament details');
    }

    if (tournament.status !== TournamentStatus.UPCOMING) {
      throw new ConflictError('Cannot update tournament that has already started');
    }

    const { name, description, startDate, endDate, maxParticipants, entryFee, prizes, rules } =
      req.body;

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim();
    if (startDate !== undefined) {
      const start = new Date(startDate);
      if (start <= new Date()) {
        throw new ValidationError('Tournament start date must be in the future');
      }
      updates.startDate = start;
    }
    if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : undefined;
    if (maxParticipants !== undefined) updates.maxParticipants = maxParticipants;
    if (entryFee !== undefined) updates.entryFee = entryFee;
    if (prizes !== undefined) updates.prizes = prizes;
    if (rules !== undefined) updates.rules = rules;

    Object.assign(tournament, updates);
    await tournament.save();

    await tournament.populate('createdBy', 'profile');

    sendSuccess(res, { tournament }, 'Tournament updated successfully');
  });

  // Delete tournament
  static deleteTournament = asyncHandler(async (req: AuthRequest, res: Response) => {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      throw new NotFoundError('Tournament');
    }

    // Only tournament creator can delete
    if (tournament.createdBy.toString() !== req.userId) {
      throw new ConflictError('Only tournament creator can delete the tournament');
    }

    if (tournament.status === TournamentStatus.ONGOING) {
      throw new ConflictError('Cannot delete ongoing tournament');
    }

    await Tournament.findByIdAndDelete(req.params.id);

    sendSuccess(res, null, 'Tournament deleted successfully');
  });

  // Get user's tournaments
  static getUserTournaments = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );
    const userId = req.params.userId;

    const filter: any = {
      $or: [{ participants: userId }, { createdBy: userId }],
    };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [tournaments, total] = await Promise.all([
      Tournament.find(filter)
        .populate('createdBy', 'profile')
        .populate('participants', 'profile')
        .sort({ startDate: -1 })
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
}
