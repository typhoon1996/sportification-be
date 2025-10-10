import { eventBus } from "../../../../shared/events/EventBus";

export const VenueCreatedEvent = "venues.venue.created";
export const VenueUpdatedEvent = "venues.venue.updated";

export class VenueEventPublisher {
  publishVenueCreated(payload: {
    venueId: string;
    name: string;
    location: any;
    createdBy: string;
  }): void {
    eventBus.publish({
      eventType: VenueCreatedEvent,
      aggregateId: payload.venueId,
      aggregateType: "Venue",
      timestamp: new Date(),
      payload,
    });
  }

  publishVenueUpdated(payload: { venueId: string; updates: string[] }): void {
    eventBus.publish({
      eventType: VenueUpdatedEvent,
      aggregateId: payload.venueId,
      aggregateType: "Venue",
      timestamp: new Date(),
      payload,
    });
  }
}
