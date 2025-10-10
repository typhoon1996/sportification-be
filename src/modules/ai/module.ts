import { Module } from "../../shared/module/Module";
import { Router } from "express";
import aiRoutes from "./api/routes";

export class AIModule extends Module {
  constructor() {
    super({
      name: "ai",
      version: "1.0.0",
      basePath: "/api/v1/ai",
      dependencies: ["users", "matches"],
    });
  }

  async initialize(): Promise<void> {
    this.registerEventHandlers();
  }

  getRouter(): Router {
    return aiRoutes;
  }

  registerEventHandlers(): void {
    // AI event handlers
  }
}

export const aiModule = new AIModule();
