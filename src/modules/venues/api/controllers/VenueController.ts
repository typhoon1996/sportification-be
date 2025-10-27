import {Request, Response} from "express";
import logger from "../../../../shared/infrastructure/logging";
import {AuthRequest} from "../../../../shared/middleware/auth";
import {
  sendSuccess,
  sendCreated,
  asyncHandler,
} from "../../../../shared/middleware/errorHandler";
import {validatePagination} from "../../../../shared/middleware/validation";
import {Venue} from "../../domain/models/Venue";
import {VenueService} from "../../domain/services/VenueService";

/**
 * VenueController - Handles venue and location management HTTP requests
 *
 * This controller manages sports venues including creation, discovery, and booking management.
 * Venues are physical locations where matches and tournaments take place. The system supports
 * both public and private venues with detailed facility information.
 *
 * Features:
 * - Venue CRUD operations (admin/moderator only for creation)
 * - Location-based venue search
 * - Sports facility filtering
 * - Availability checking
 * - Booking integration
 *
 * Venue Types:
 * - Public: Available for all users to book
 * - Private: Restricted access, requires approval
 *
 * @class VenueController
 */
export class VenueController {
  private venueService: VenueService;

  /**
   * Initializes the VenueController with required services
   * Creates a new instance of VenueService for handling venue operations
   */
  constructor() {
    this.venueService = new VenueService();
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
   * Create a new venue
   *
   * Creates a sports venue with detailed facility information. Typically restricted
   * to administrators or moderators via route middleware. Venues can support multiple
   * sports and include amenities like parking, changing rooms, etc.
   *
   * Business Rules:
   * - Only admins/moderators can create venues (enforced by route middleware)
   * - Location coordinates must be valid (latitude/longitude)
   * - At least one sport must be specified
   * - Initial status is set to 'active'
   *
   * @async
   * @param {AuthRequest} req - Authenticated request with venue data
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 201 Created with venue details
   *
   * @requires Authentication - User must be authenticated
   * @requires Authorization - Admin or Moderator role (enforced by route middleware)
   *
   * @throws {ValidationError} If required fields are missing or invalid
   *
   * @example
   * POST /api/v1/venues
   * Body: {
   *   name: "Central Sports Complex",
   *   address: "123 Main St, City",
   *   location: {
   *     type: "Point",
   *     coordinates: [-73.935242, 40.730610]
   *   },
   *   sports: ["football", "basketball"],
   *   facilities: ["parking", "changing_rooms", "cafeteria"],
   *   capacity: 500
   * }
   */
  createVenue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const venue = await this.venueService.createVenue(userId, req.body);

    await venue.populate("createdBy", "profile");

    logger.info(`Venue created by user: ${userId}`, {
      venueId: venue.id,
      name: venue.name,
    });

    sendCreated(res, {venue}, "Venue created successfully");
  });

  /**
   * Get all venues with filtering and pagination
   *
   * Retrieves a paginated list of active venues. Supports filtering by sport type
   * and searching by venue name. Results are sorted alphabetically by name.
   *
   * @async
   * @param {Request} req - Express request with query parameters
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with paginated venue list
   *
   * Query Parameters:
   * - page: Page number (default: 1)
   * - limit: Results per page (default: 10)
   * - sport: Filter by supported sport type
   * - search: Search by venue name (case-insensitive)
   * - lat: Latitude for location-based search (requires lon)
   * - lon: Longitude for location-based search (requires lat)
   * - radius: Search radius in kilometers (default: 10)
   *
   * @example
   * GET /api/v1/venues?sport=football&search=central&page=1
   */
  getVenues = asyncHandler(async (req: Request, res: Response) => {
    const {page, limit, skip} = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );

    const filter: any = {status: "active"};

    // Apply optional filters
    if (req.query.sport) {
      filter.sports = req.query.sport;
    }
    if (req.query.search) {
      filter.name = new RegExp(req.query.search as string, "i");
    }

    // Execute query and count in parallel for better performance
    const [venues, total] = await Promise.all([
      Venue.find(filter)
        .populate("createdBy", "profile")
        .sort({name: 1})
        .skip(skip)
        .limit(limit),
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

  /**
   * Get venue by ID
   *
   * Retrieves detailed information about a specific venue including location,
   * supported sports, facilities, and availability status.
   *
   * @async
   * @param {Request} req - Express request with venue ID parameter
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with venue details
   *
   * @throws {Error} If venue doesn't exist
   *
   * @example
   * GET /api/v1/venues/507f1f77bcf86cd799439011
   */
  getVenueById = asyncHandler(async (req: Request, res: Response) => {
    const venue = await Venue.findById(req.params.id).populate(
      "createdBy",
      "profile"
    );

    if (!venue) {
      throw new Error("Venue not found");
    }

    sendSuccess(res, {venue});
  });

  /**
   * Update venue information
   *
   * Updates venue details such as name, address, facilities, or capacity.
   * Only administrators, moderators, or the venue creator can update venue information.
   *
   * Updatable Fields:
   * - name: Venue name
   * - address: Physical address
   * - location: GPS coordinates
   * - sports: Supported sports array
   * - facilities: Available amenities
   * - capacity: Maximum capacity
   * - status: Active/inactive status
   *
   * @async
   * @param {AuthRequest} req - Authenticated request with venue ID and update data
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with updated venue details
   *
   * @requires Authentication - User must be authenticated
   * @requires Authorization - Admin, Moderator, or venue creator
   *
   * @throws {Error} If venue doesn't exist
   * @throws {ForbiddenError} If user is not authorized to update venue
   *
   * @example
   * PATCH /api/v1/venues/507f1f77bcf86cd799439011
   * Body: {
   *   capacity: 600,
   *   facilities: ["parking", "changing_rooms", "cafeteria", "wifi"]
   * }
   */
  updateVenue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    const venue = await this.venueService.updateVenue(
      req.params.id as string,
      userId,
      req.body
    );

    await venue.populate("createdBy", "profile");

    logger.info(`Venue updated by user: ${userId}`, {
      venueId: venue.id,
    });

    sendSuccess(res, {venue}, "Venue updated successfully");
  });

  /**
   * Delete a venue
   *
   * Permanently deletes a venue from the system or marks it as inactive.
   * Only administrators, moderators, or the venue creator can delete venues.
   * Venues with active bookings cannot be deleted.
   *
   * Business Rules:
   * - Only admin/moderator/creator can delete
   * - Cannot delete venues with active bookings
   * - May soft-delete (mark as inactive) instead of hard delete
   *
   * @async
   * @param {AuthRequest} req - Authenticated request with venue ID parameter
   * @param {Response} res - Express response object
   * @returns {Promise<void>} 200 OK with success message
   *
   * @requires Authentication - User must be authenticated
   * @requires Authorization - Admin, Moderator, or venue creator
   *
   * @throws {Error} If venue doesn't exist
   * @throws {ForbiddenError} If user is not authorized to delete venue
   * @throws {ConflictError} If venue has active bookings
   *
   * @example
   * DELETE /api/v1/venues/507f1f77bcf86cd799439011
   */
  deleteVenue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = this.getUserId(req);
    await this.venueService.deleteVenue(req.params.id as string, userId);

    logger.info(`Venue deleted by user: ${userId}`, {
      venueId: req.params.id,
    });

    sendSuccess(res, null, "Venue deleted successfully");
  });
}

/**
 * Singleton instance of VenueController
 * Exported for use in route definitions
 * @const {VenueController}
 */
export const venueController = new VenueController();
