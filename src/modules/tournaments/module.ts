import { Module } from "../../shared/module/Module";
import { Router } from "express";
import tournamentRoutes from "./api/routes";

export class TournamentsModule extends Module {
  constructor() {
    super({
      name: "tournaments",
      version: "1.0.0",
      basePath: "/api/v1/tournaments",
      dependencies: ["matches", "users"],
    });
  }

  async initialize(): Promise<void> {
    this.registerEventHandlers();
  }

  getRouter(): Router {
    return tournamentRoutes;
  }

  registerEventHandlers(): void {
    // Tournament event handlers
  }
}

export const tournamentsModule = new TournamentsModule();
