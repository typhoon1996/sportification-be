import { eventBus } from '@/shared/events/EventBus';
import logger from '@/shared/infrastructure/logging';

/**
 * UsersEventPublisher - Publishes domain events for users module
 */
export class UsersEventPublisher {
  private static readonly MODULE_NAME = 'users';

  /**
   * Publish entity created event
   */
  static publishCreated(data: any): void {
    try {
      eventBus.publish({
        eventType: `${this.MODULE_NAME}.created`,
        aggregateId: data.id,
        aggregateType: 'Users',
        timestamp: new Date(),
        payload: data,
      });
      
      logger.info(`Published ${this.MODULE_NAME}.created event`, { id: data.id });
    } catch (error) {
      logger.error(`Failed to publish ${this.MODULE_NAME}.created event`, error);
    }
  }

  /**
   * Publish entity updated event
   */
  static publishUpdated(data: any): void {
    try {
      eventBus.publish({
        eventType: `${this.MODULE_NAME}.updated`,
        aggregateId: data.id,
        aggregateType: 'Users',
        timestamp: new Date(),
        payload: data,
      });
      
      logger.info(`Published ${this.MODULE_NAME}.updated event`, { id: data.id });
    } catch (error) {
      logger.error(`Failed to publish ${this.MODULE_NAME}.updated event`, error);
    }
  }

  /**
   * Publish entity deleted event
   */
  static publishDeleted(id: string): void {
    try {
      eventBus.publish({
        eventType: `${this.MODULE_NAME}.deleted`,
        aggregateId: id,
        aggregateType: 'Users',
        timestamp: new Date(),
        payload: { id },
      });
      
      logger.info(`Published ${this.MODULE_NAME}.deleted event`, { id });
    } catch (error) {
      logger.error(`Failed to publish ${this.MODULE_NAME}.deleted event`, error);
    }
  }
}
