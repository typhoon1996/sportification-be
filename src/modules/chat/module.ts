import { Module } from "../../shared/module/Module";
import { Router } from "express";
import chatRoutes from "./api/routes";

export class ChatModule extends Module {
  constructor() {
    super({
      name: "chat",
      version: "1.0.0",
      basePath: "/api/v1/chats",
      dependencies: ["users"],
    });
  }

  async initialize(): Promise<void> {
    this.registerEventHandlers();
  }

  getRouter(): Router {
    return chatRoutes;
  }

  registerEventHandlers(): void {
    // Chat event handlers
  }
}

export const chatModule = new ChatModule();
