import { Module } from "../../shared/module/Module";
import { Router } from "express";
import teamRoutes from "./api/routes";

export class TeamsModule extends Module {
  constructor() {
    super({
      name: "teams",
      version: "1.0.0",
      basePath: "/api/v1/teams",
      dependencies: ["users"],
    });
  }

  async initialize(): Promise<void> {
    this.registerEventHandlers();
  }

  getRouter(): Router {
    return teamRoutes;
  }

  registerEventHandlers(): void {
    // Team event handlers
  }
}

export const teamsModule = new TeamsModule();
