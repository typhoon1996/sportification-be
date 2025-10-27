import {Router} from "express";
import {Module} from "../../shared/module/Module";
import userRoutes from "./api/routes";
import {UserEventSubscriber} from "./events/subscribers/UserEventSubscriber";

export class UsersModule extends Module {
  constructor() {
    super({
      name: "users",
      version: "1.0.0",
      basePath: "/api/v1/users",
      dependencies: ["iam"], // Depends on IAM module
    });
  }

  async initialize(): Promise<void> {
    this.registerEventHandlers();
  }

  getRouter(): Router {
    return userRoutes;
  }

  registerEventHandlers(): void {
    UserEventSubscriber.initialize();
  }
}

export const usersModule = new UsersModule();
