import {Router} from "express";
import {eventBus} from "../events/EventBus";

export interface ModuleConfig {
  name: string;
  version: string;
  basePath: string;
  dependencies?: string[];
}

export abstract class Module {
  protected config: ModuleConfig;
  protected router: Router;

  constructor(config: ModuleConfig) {
    this.config = config;
    this.router = Router();
  }

  abstract initialize(): Promise<void>;
  abstract getRouter(): Router;
  abstract registerEventHandlers(): void | Promise<void>;

  getName(): string {
    return this.config.name;
  }

  getBasePath(): string {
    return this.config.basePath;
  }

  protected publishEvent(eventType: string, payload: any): void {
    eventBus.publish({
      eventType,
      aggregateId: payload.id || "unknown",
      aggregateType: this.config.name,
      timestamp: new Date(),
      payload,
      metadata: {
        correlationId: payload.correlationId,
      },
    });
  }

  protected subscribeToEvent(
    eventType: string,
    handler: (event: any) => void | Promise<void>
  ): void {
    eventBus.subscribe(eventType, handler);
  }
}
