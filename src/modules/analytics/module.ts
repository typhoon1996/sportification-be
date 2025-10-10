import { Module } from "../../shared/module/Module";
import { Router } from "express";
import analyticsRoutes from "./api/routes";
import { AnalyticsEventSubscriber } from "./events/subscribers/AnalyticsEventSubscriber";

export class AnalyticsModule extends Module {
  private readonly eventSubscriber: AnalyticsEventSubscriber;

  constructor() {
    super({
      name: "analytics",
      version: "1.0.0",
      basePath: "/api/v1/admin/analytics",
      dependencies: ["users", "matches"],
    });
    this.eventSubscriber = new AnalyticsEventSubscriber();
  }

  async initialize(): Promise<void> {
    this.registerEventHandlers();
  }

  getRouter(): Router {
    return analyticsRoutes;
  }

  registerEventHandlers(): void {
    // Subscribe to all events for analytics tracking
    this.eventSubscriber.subscribe();
  }
}

export const analyticsModule = new AnalyticsModule();
