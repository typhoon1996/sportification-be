/**
 * IAM Module Public API
 *
 * This is the ONLY file that other modules should import from.
 * All internal implementation details are hidden.
 */

// Export module instance
export { iamModule } from "./module";

// Export public services
export { AuthService } from "./domain/services/AuthService";

// Export events (for other modules to subscribe)
export {
  UserRegisteredEvent,
  UserLoggedInEvent,
  UserLoggedOutEvent,
  PasswordChangedEvent,
  AccountDeactivatedEvent,
  MFAEnabledEvent,
  MFADisabledEvent,
} from "./events/publishers/IamEventPublisher";

// Export public types (if needed)
export type { IUser } from "../../shared/types";
