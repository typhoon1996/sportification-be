declare module "rate-limit-redis" {
  import type { Store } from "express-rate-limit";

  export interface RedisStoreOptions {
    sendCommand: (...args: string[]) => Promise<unknown>;
    prefix?: string;
  }

  export default class RedisStore implements Store {
    constructor(options: RedisStoreOptions);
  }
}
