import {EventEmitter} from "events";
import logger from "../infrastructure/logging";

export interface DomainEvent {
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  timestamp: Date;
  payload: any;
  metadata?: {
    userId?: string;
    correlationId?: string;
    causationId?: string;
  };
}

class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    this.setMaxListeners(100); // Allow many subscribers
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  publish(event: DomainEvent): void {
    logger.info(`📢 Event published: ${event.eventType}`, {
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
    });

    this.emit(event.eventType, event);
    this.emit("*", event); // Global event listener
  }

  subscribe(
    eventType: string,
    handler: (event: DomainEvent) => void | Promise<void>
  ): void {
    this.on(eventType, async (event: DomainEvent) => {
      try {
        await handler(event);
      } catch (error) {
        logger.error(`❌ Error handling event ${eventType}:`, error);
      }
    });
  }

  subscribeAll(handler: (event: DomainEvent) => void | Promise<void>): void {
    this.subscribe("*", handler);
  }
}

export const eventBus = EventBus.getInstance();
