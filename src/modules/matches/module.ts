import {Module} from "../../shared/module/Module";
import {Router} from "express";
import matchRoutes from "./api/routes";
import {MatchEventSubscriber} from "./events/subscribers/MatchEventSubscriber";

export class MatchesModule extends Module {
  constructor() {
    super({
      name: "matches",
      version: "1.0.0",
      basePath: "/api/v1/matches",
      dependencies: ["users"],
    });
  }

  async initialize(): Promise<void> {
    this.registerEventHandlers();
  }

  getRouter(): Router {
    return matchRoutes;
  }

  registerEventHandlers(): void {
    MatchEventSubscriber.initialize();
  }
}

export const matchesModule = new MatchesModule();
