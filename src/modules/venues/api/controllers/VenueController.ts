import { Request, Response } from 'express';
import { VenueService } from '../../domain/services/VenueService';
import { sendSuccess, sendCreated, asyncHandler } from '../../../../shared/middleware/errorHandler';
import { AuthRequest } from '../../../../shared/middleware/auth';
import { validatePagination } from '../../../../shared/middleware/validation';
import { Venue } from '../../domain/models/Venue';
import logger from '../../../../shared/utils/logger';

export class VenueController {
  private venueService: VenueService;

  constructor() {
    this.venueService = new VenueService();
  }

  private getUserId(req: AuthRequest): string {
    if (!req.userId) {
      throw new Error('User not authenticated');
    }
    return req.userId;
  }

  createVenue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const venue = await this.venueService.createVenue(userId, req.body);

    await venue.populate('createdBy', 'profile');

    logger.info(`Venue created by user: ${userId}`, {
      venueId: venue.id,
      name: venue.name,
    });

    sendCreated(res, { venue }, 'Venue created successfully');
  });

  getVenues = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );

    const filter: any = { status: 'active' };

    if (req.query.sport) {
      filter.sports = req.query.sport;
    }
    if (req.query.search) {
      filter.name = new RegExp(req.query.search as string, 'i');
    }

    const [venues, total] = await Promise.all([
      Venue.find(filter).populate('createdBy', 'profile').sort({ name: 1 }).skip(skip).limit(limit),
      Venue.countDocuments(filter),
    ]);

    sendSuccess(res, {
      venues,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  getVenueById = asyncHandler(async (req: Request, res: Response) => {
    const venue = await Venue.findById(req.params.id).populate('createdBy', 'profile');

    if (!venue) {
      throw new Error('Venue not found');
    }

    sendSuccess(res, { venue });
  });

  updateVenue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const venue = await this.venueService.updateVenue(req.params.id as string, userId, req.body);

    await venue.populate('createdBy', 'profile');

    logger.info(`Venue updated by user: ${userId}`, {
      venueId: venue.id,
    });

    sendSuccess(res, { venue }, 'Venue updated successfully');
  });

  deleteVenue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    await this.venueService.deleteVenue(req.params.id as string, userId);

    logger.info(`Venue deleted by user: ${userId}`, {
      venueId: req.params.id,
    });

    sendSuccess(res, null, 'Venue deleted successfully');
  });
}

export const venueController = new VenueController();
