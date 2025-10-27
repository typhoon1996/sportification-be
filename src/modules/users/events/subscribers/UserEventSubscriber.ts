import {eventBus} from "../../../../shared/events/EventBus";
import logger from "../../../../shared/infrastructure/logging";
import {UserRegisteredEvent} from "../../../iam";

export class UserEventSubscriber {
  static initialize(): void {
    // Listen to IAM events
    eventBus.subscribe(
      UserRegisteredEvent,
      this.handleUserRegistered.bind(this)
    );
  }

  private static async handleUserRegistered(event: any): Promise<void> {
    try {
      const {
        userId,
        profileId,
        firstName: _firstName,
        lastName: _lastName,
        username,
      } = event.payload;

      logger.info(
        `✓ User profile already created during registration: ${username}`,
        {
          userId,
          profileId,
        }
      );

      // Profile is already created in the IAM module during registration
      // This is just for logging and any additional user-specific initialization
      // If we need to do anything extra with the user profile, we can do it here
    } catch (error) {
      logger.error(`❌ Error handling user registered event:`, error);
    }
  }
}
