import {Venue} from "../../domain/models/Venue";
import {VenueEventPublisher} from "../../events/publishers/VenueEventPublisher";
import {
  NotFoundError,
  ValidationError,
} from "../../../../shared/middleware/errorHandler";

/**
 * VenueService - Business logic for venue management
 *
 * Handles venue creation, updates, and deletion with proper authorization.
 * Publishes domain events for cross-module integration (bookings, matches).
 * Supports geolocation-based venue discovery and facility management.
 *
 * Features:
 * - Venue CRUD operations with authorization
 * - Geospatial location management
 * - Event publishing for system integration
 * - Creator-only update/delete permissions
 * - Facility and amenity tracking
 */
export class VenueService {
  private eventPublisher: VenueEventPublisher;

  constructor() {
    this.eventPublisher = new VenueEventPublisher();
  }

  /**
   * Create a new venue with geolocation
   *
   * Creates a venue with specified details, sets the creator, and publishes
   * a domain event for other modules. Venues start with 'active' status.
   * Location data enables geospatial queries for nearby venue discovery.
   *
   * @async
   * @param {string} userId - Creator user ID (will be set as venue owner)
   * @param {any} venueData - Venue creation data (name, location, facilities, etc.)
   * @return {Promise<Venue>} Created venue document
   *
   * @example
   * const venue = await venueService.createVenue(userId, {
   *   name: 'City Sports Complex',
   *   location: { type: 'Point', coordinates: [lng, lat] },
   *   sports: ['football', 'basketball'],
   *   facilities: ['parking', 'showers']
   * });
   */
  async createVenue(userId: string, venueData: any) {
    const venue = new Venue({
      ...venueData,
      createdBy: userId,
      status: "active",
    });

    await venue.save();

    // Publish event
    this.eventPublisher.publishVenueCreated({
      venueId: venue.id,
      name: venue.name,
      location: venue.location,
      createdBy: userId,
    });

    return venue;
  }

  /**
   * Update venue details with creator authorization
   *
   * Updates venue information after verifying the user is the creator.
   * Only venue creators can modify venue details. Supports partial updates
   * via Object.assign pattern.
   *
   * @async
   * @param {string} venueId - Venue ID to update
   * @param {string} userId - User ID attempting the update (for authorization)
   * @param {any} updates - Partial venue data to update
   * @return {Promise<Venue>} Updated venue document
   * @throws {NotFoundError} If venue not found
   * @throws {ValidationError} If user is not the venue creator
   *
   * @example
   * const updated = await venueService.updateVenue(venueId, userId, {
   *   description: 'Updated description',
   *   capacity: 50
   * });
   */
  async updateVenue(venueId: string, userId: string, updates: any) {
    const venue = await Venue.findById(venueId);

    if (!venue) {
      throw new NotFoundError("Venue");
    }

    if (venue.createdBy.toString() !== userId) {
      throw new ValidationError("Only venue creator can update it");
    }

    Object.assign(venue, updates);
    await venue.save();

    return venue;
  }

  /**
   * Delete a venue with creator authorization
   *
   * Permanently removes a venue after verifying the user is the creator.
   * Only venue creators can delete venues. Should check for active bookings
   * before deletion in production systems.
   *
   * @async
   * @param {string} venueId - Venue ID to delete
   * @param {string} userId - User ID attempting deletion (for authorization)
   * @return {Promise<{ success: boolean }>} Deletion confirmation
   * @throws {NotFoundError} If venue not found
   * @throws {ValidationError} If user is not the venue creator
   *
   * @example
   * const result = await venueService.deleteVenue(venueId, userId);
   * // Returns: { success: true }
   */
  async deleteVenue(venueId: string, userId: string) {
    const venue = await Venue.findById(venueId);

    if (!venue) {
      throw new NotFoundError("Venue");
    }

    if (venue.createdBy.toString() !== userId) {
      throw new ValidationError("Only venue creator can delete it");
    }

    await venue.deleteOne();

    return {success: true};
  }
}
