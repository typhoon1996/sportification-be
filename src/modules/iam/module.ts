import {Module, ModuleConfig} from "../../shared/module/Module";
import {Router} from "express";
import authRoutes from "./api/routes";

export class IAMModule extends Module {
  constructor() {
    super({
      name: "iam",
      version: "1.0.0",
      basePath: "/api/v1/auth",
      dependencies: [],
    });
  }

  async initialize(): Promise<void> {
    // Initialize any IAM-specific setup
    await this.registerEventHandlers();
  }

  getRouter(): Router {
    return authRoutes;
  }

  async registerEventHandlers(): Promise<void> {
    // IAM doesn't subscribe to other module events initially
    // But this is where we would register any event subscriptions
  }
}

export const iamModule = new IAMModule();
