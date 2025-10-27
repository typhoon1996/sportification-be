/**
 * Booking Event Publisher - Publishes booking-related domain events
 */

import {eventBus} from "../../../../shared/events/EventBus";
import logger from "../../../../shared/infrastructure/logging";

export interface BookingCreatedEvent {
  bookingId: string;
  venueId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
}

export interface BookingUpdatedEvent {
  bookingId: string;
  userId: string;
  updates: any;
}

export interface BookingCancelledEvent {
  bookingId: string;
  userId: string;
  reason: string;
  refundAmount: number;
}

export interface PaymentConfirmedEvent {
  bookingId: string;
  transactionId: string;
  amount: number;
}

export interface BookingCheckedInEvent {
  bookingId: string;
  userId: string;
  checkInTime: Date;
}

export interface BookingCompletedEvent {
  bookingId: string;
  userId: string;
  checkOutTime: Date;
}

export interface BookingNoShowEvent {
  bookingId: string;
  userId: string;
}

export class BookingEventPublisher {
  /**
   * Publish booking created event
   */
  publishBookingCreated(payload: BookingCreatedEvent): void {
    try {
      eventBus.publish({
        eventType: "venues.booking.created",
        aggregateId: payload.bookingId,
        aggregateType: "Booking",
        timestamp: new Date(),
        payload,
        metadata: {
          userId: payload.userId,
        },
      });

      logger.info("Published booking created event", {
        bookingId: payload.bookingId,
      });
    } catch (error) {
      logger.error("Failed to publish booking created event", {error, payload});
    }
  }

  /**
   * Publish booking updated event
   */
  publishBookingUpdated(payload: BookingUpdatedEvent): void {
    try {
      eventBus.publish({
        eventType: "venues.booking.updated",
        aggregateId: payload.bookingId,
        aggregateType: "Booking",
        timestamp: new Date(),
        payload,
        metadata: {
          userId: payload.userId,
        },
      });

      logger.info("Published booking updated event", {
        bookingId: payload.bookingId,
      });
    } catch (error) {
      logger.error("Failed to publish booking updated event", {error, payload});
    }
  }

  /**
   * Publish booking cancelled event
   */
  publishBookingCancelled(payload: BookingCancelledEvent): void {
    try {
      eventBus.publish({
        eventType: "venues.booking.cancelled",
        aggregateId: payload.bookingId,
        aggregateType: "Booking",
        timestamp: new Date(),
        payload,
        metadata: {
          userId: payload.userId,
        },
      });

      logger.info("Published booking cancelled event", {
        bookingId: payload.bookingId,
        refundAmount: payload.refundAmount,
      });
    } catch (error) {
      logger.error("Failed to publish booking cancelled event", {
        error,
        payload,
      });
    }
  }

  /**
   * Publish payment confirmed event
   */
  publishPaymentConfirmed(payload: PaymentConfirmedEvent): void {
    try {
      eventBus.publish({
        eventType: "venues.booking.payment.confirmed",
        aggregateId: payload.bookingId,
        aggregateType: "Booking",
        timestamp: new Date(),
        payload,
        metadata: {},
      });

      logger.info("Published payment confirmed event", {
        bookingId: payload.bookingId,
        transactionId: payload.transactionId,
      });
    } catch (error) {
      logger.error("Failed to publish payment confirmed event", {
        error,
        payload,
      });
    }
  }

  /**
   * Publish booking checked in event
   */
  publishBookingCheckedIn(payload: BookingCheckedInEvent): void {
    try {
      eventBus.publish({
        eventType: "venues.booking.checkedIn",
        aggregateId: payload.bookingId,
        aggregateType: "Booking",
        timestamp: new Date(),
        payload,
        metadata: {
          userId: payload.userId,
        },
      });

      logger.info("Published booking checked in event", {
        bookingId: payload.bookingId,
      });
    } catch (error) {
      logger.error("Failed to publish booking checked in event", {
        error,
        payload,
      });
    }
  }

  /**
   * Publish booking completed event
   */
  publishBookingCompleted(payload: BookingCompletedEvent): void {
    try {
      eventBus.publish({
        eventType: "venues.booking.completed",
        aggregateId: payload.bookingId,
        aggregateType: "Booking",
        timestamp: new Date(),
        payload,
        metadata: {
          userId: payload.userId,
        },
      });

      logger.info("Published booking completed event", {
        bookingId: payload.bookingId,
      });
    } catch (error) {
      logger.error("Failed to publish booking completed event", {
        error,
        payload,
      });
    }
  }

  /**
   * Publish booking no-show event
   */
  publishBookingNoShow(payload: BookingNoShowEvent): void {
    try {
      eventBus.publish({
        eventType: "venues.booking.noShow",
        aggregateId: payload.bookingId,
        aggregateType: "Booking",
        timestamp: new Date(),
        payload,
        metadata: {
          userId: payload.userId,
        },
      });

      logger.info("Published booking no-show event", {
        bookingId: payload.bookingId,
      });
    } catch (error) {
      logger.error("Failed to publish booking no-show event", {error, payload});
    }
  }
}
