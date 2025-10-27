import {Module} from "../../shared/module/Module";
import {Router} from "express";
import notificationRoutes from "./api/routes";
import {NotificationEventSubscriber} from "./events/subscribers/NotificationEventSubscriber";

export class NotificationsModule extends Module {
  private eventSubscriber: NotificationEventSubscriber;

  constructor() {
    super({
      name: "notifications",
      version: "1.0.0",
      basePath: "/api/v1/notifications",
      dependencies: ["users"],
    });
    this.eventSubscriber = new NotificationEventSubscriber();
  }

  async initialize(): Promise<void> {
    this.registerEventHandlers();
  }

  getRouter(): Router {
    return notificationRoutes;
  }

  registerEventHandlers(): void {
    // Subscribe to all events from other modules
    this.eventSubscriber.subscribe();
  }
}

export const notificationsModule = new NotificationsModule();
