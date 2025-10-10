import { Module } from "../../shared/module/Module";
import { Router } from "express";
import venueRoutes from "./api/routes";

export class VenuesModule extends Module {
  constructor() {
    super({
      name: "venues",
      version: "1.0.0",
      basePath: "/api/v1/venues",
      dependencies: [],
    });
  }

  async initialize(): Promise<void> {
    this.registerEventHandlers();
  }

  getRouter(): Router {
    return venueRoutes;
  }

  registerEventHandlers(): void {
    // Venue event handlers
  }
}

export const venuesModule = new VenuesModule();
