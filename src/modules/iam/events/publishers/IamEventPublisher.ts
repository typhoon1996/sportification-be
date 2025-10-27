import {eventBus} from "../../../../shared/events/EventBus";

// Event type constants
export const UserRegisteredEvent = "iam.user.registered";
export const UserLoggedInEvent = "iam.user.logged_in";
export const UserLoggedOutEvent = "iam.user.logged_out";
export const PasswordChangedEvent = "iam.password.changed";
export const AccountDeactivatedEvent = "iam.account.deactivated";
export const MFAEnabledEvent = "iam.mfa.enabled";
export const MFADisabledEvent = "iam.mfa.disabled";

export class IamEventPublisher {
  publishUserRegistered(payload: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    profileId: string;
  }): void {
    eventBus.publish({
      eventType: UserRegisteredEvent,
      aggregateId: payload.userId,
      aggregateType: "User",
      timestamp: new Date(),
      payload,
    });
  }

  publishUserLoggedIn(payload: {
    userId: string;
    email: string;
    timestamp: Date;
  }): void {
    eventBus.publish({
      eventType: UserLoggedInEvent,
      aggregateId: payload.userId,
      aggregateType: "User",
      timestamp: new Date(),
      payload,
    });
  }

  publishUserLoggedOut(payload: {
    userId: string;
    email: string;
    timestamp: Date;
  }): void {
    eventBus.publish({
      eventType: UserLoggedOutEvent,
      aggregateId: payload.userId,
      aggregateType: "User",
      timestamp: new Date(),
      payload,
    });
  }

  publishPasswordChanged(payload: {
    userId: string;
    email: string;
    timestamp: Date;
  }): void {
    eventBus.publish({
      eventType: PasswordChangedEvent,
      aggregateId: payload.userId,
      aggregateType: "User",
      timestamp: new Date(),
      payload,
    });
  }

  publishAccountDeactivated(payload: {
    userId: string;
    email: string;
    timestamp: Date;
  }): void {
    eventBus.publish({
      eventType: AccountDeactivatedEvent,
      aggregateId: payload.userId,
      aggregateType: "User",
      timestamp: new Date(),
      payload,
    });
  }

  publishMFAEnabled(payload: {
    userId: string;
    email: string;
    timestamp: Date;
  }): void {
    eventBus.publish({
      eventType: MFAEnabledEvent,
      aggregateId: payload.userId,
      aggregateType: "User",
      timestamp: new Date(),
      payload,
    });
  }

  publishMFADisabled(payload: {
    userId: string;
    email: string;
    timestamp: Date;
  }): void {
    eventBus.publish({
      eventType: MFADisabledEvent,
      aggregateId: payload.userId,
      aggregateType: "User",
      timestamp: new Date(),
      payload,
    });
  }
}
