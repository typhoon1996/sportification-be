import { Venue } from '../../domain/models/Venue';
import { VenueEventPublisher } from '../../events/publishers/VenueEventPublisher';
import { NotFoundError, ValidationError } from '../../../../shared/middleware/errorHandler';

export class VenueService {
  private eventPublisher: VenueEventPublisher;

  constructor() {
    this.eventPublisher = new VenueEventPublisher();
  }

  async createVenue(userId: string, venueData: any) {
    const venue = new Venue({
      ...venueData,
      createdBy: userId,
      status: 'active',
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

  async updateVenue(venueId: string, userId: string, updates: any) {
    const venue = await Venue.findById(venueId);

    if (!venue) {
      throw new NotFoundError('Venue');
    }

    if (venue.createdBy.toString() !== userId) {
      throw new ValidationError('Only venue creator can update it');
    }

    Object.assign(venue, updates);
    await venue.save();

    return venue;
  }

  async deleteVenue(venueId: string, userId: string) {
    const venue = await Venue.findById(venueId);

    if (!venue) {
      throw new NotFoundError('Venue');
    }

    if (venue.createdBy.toString() !== userId) {
      throw new ValidationError('Only venue creator can delete it');
    }

    await venue.deleteOne();

    return { success: true };
  }
}
