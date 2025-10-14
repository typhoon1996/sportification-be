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

export class MatchController {
  private getUserId(req: AuthRequest): string {
    if (!req.userId) {
      throw new Error("User not authenticated");
    }
    return req.userId;
  }

  // Create a new match
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
    await match.populate([
      {path: "createdBy", select: "profile"},
      {path: "participants", select: "profile"},
      {path: "venue", select: "name location"},
    ]);

    sendCreated(res, {match}, "Match created successfully");
  });

  // Get all matches with filtering and pagination
  getMatches = asyncHandler(async (req: Request, res: Response) => {
    const {page, limit, skip} = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );
    const sort = validateSort(req.query.sort as string) || {
      "schedule.date": -1,
    };

    const filter: any = {};

    // Apply filters
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.sport)
      filter.sport = new RegExp(req.query.sport as string, "i");
    if (req.query.venue) filter.venue = req.query.venue;

    // Date range filter
    if (req.query.fromDate || req.query.toDate) {
      filter["schedule.date"] = {};
      if (req.query.fromDate)
        filter["schedule.date"].$gte = new Date(req.query.fromDate as string);
      if (req.query.toDate)
        filter["schedule.date"].$lte = new Date(req.query.toDate as string);
    }

    // Only show public matches or matches the user is participating in
    if (req.user) {
      filter.$or = [
        {type: MatchType.PUBLIC},
        {participants: req.userId},
        {createdBy: req.userId},
      ];
    } else {
      filter.type = MatchType.PUBLIC;
    }

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

  // Get match by ID
  getMatchById = asyncHandler(async (req: Request, res: Response) => {
    const match = await Match.findById(req.params.id)
      .populate("createdBy", "profile")
      .populate("participants", "profile")
      .populate("venue", "name location surfaceType")
      .populate("winner", "profile");

    if (!match) {
      throw new NotFoundError("Match");
    }

    // Check if user can view private match
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

  // Join a match
  joinMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const match = await Match.findById(req.params.id);

    if (!match) {
      throw new NotFoundError("Match");
    }

    if (match.status !== MatchStatus.UPCOMING) {
      throw new ConflictError("Cannot join match that is not upcoming");
    }

    // Use the model's isParticipant method
    if ((match as any).isParticipant(req.userId)) {
      throw new ConflictError("Already participating in this match");
    }

    // Check maxParticipants if it exists
    const maxParticipants = (match as any).maxParticipants;
    if (maxParticipants && match.participants.length >= maxParticipants) {
      throw new ConflictError("Match is full");
    }

    // Use the model's addParticipant method
    (match as any).addParticipant(req.userId);
    await match.save();

    await match.populate("participants", "profile");

    sendSuccess(res, {match}, "Successfully joined the match");
  });

  // Leave a match
  leaveMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const match = await Match.findById(req.params.id);

    if (!match) {
      throw new NotFoundError("Match");
    }

    // Use the model's isParticipant method
    if (!(match as any).isParticipant(req.userId)) {
      throw new ConflictError("Not participating in this match");
    }

    // Use the model's isCreator method
    if ((match as any).isCreator(req.userId)) {
      throw new ConflictError("Match creator cannot leave the match");
    }

    if (match.status === MatchStatus.ONGOING) {
      throw new ConflictError("Cannot leave match that is ongoing");
    }

    // Use the model's removeParticipant method
    (match as any).removeParticipant(req.userId);
    await match.save();

    sendSuccess(res, null, "Successfully left the match");
  });

  // Update match score
  updateScore = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {scores, winner} = req.body;
    const match = await Match.findById(req.params.id);

    if (!match) {
      throw new NotFoundError("Match");
    }

    // Only participants or creator can update scores
    const isParticipant = (match as any).isParticipant(req.userId);
    const isCreator = (match as any).isCreator(req.userId);

    if (!isParticipant && !isCreator) {
      throw new ConflictError("Only participants can update match scores");
    }

    if (match.status !== MatchStatus.ONGOING) {
      throw new ConflictError("Can only update scores for ongoing matches");
    }

    match.scores = scores;
    if (winner) {
      // Verify winner is a participant
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

  // Update match status
  updateMatchStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {status} = req.body;
    const match = await Match.findById(req.params.id);

    if (!match) {
      throw new NotFoundError("Match");
    }

    // Only match creator can update status (or admin/moderator via middleware)
    if (!(match as any).isCreator(req.userId)) {
      // Check if user is admin or moderator
      const userRole = req.user?.role || "user";
      if (!["admin", "moderator"].includes(userRole)) {
        throw new ConflictError("Only match creator can update match status");
      }
    }

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

  // Delete match (Admin/Moderator only via route middleware)
  deleteMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const match = await Match.findById(req.params.id);

    if (!match) {
      throw new NotFoundError("Match");
    }

    // Additional check: cannot delete ongoing match
    if (match.status === MatchStatus.ONGOING) {
      throw new ConflictError("Cannot delete ongoing match");
    }

    await Match.findByIdAndDelete(req.params.id);

    sendSuccess(res, null, "Match deleted successfully");
  });

  // Get user's matches
  getUserMatches = asyncHandler(async (req: Request, res: Response) => {
    const {page, limit, skip} = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );
    const userId = req.params.userId;

    const filter: any = {
      $or: [{participants: userId}, {createdBy: userId}],
    };

    if (req.query.status) {
      filter.status = req.query.status;
    }

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

export const matchController = new MatchController();
