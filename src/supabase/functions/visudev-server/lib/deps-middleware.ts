/**
 * Dependency injection middleware. Injects kv and checkRateLimit into Hono context
 * so routes receive them via c.get(). Factory allows composition root (index) to
 * supply dependencies instead of hardcoding them here.
 */
import type { MiddlewareHandler } from "hono";

export type KvStore = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<void>;
  del: (key: string) => Promise<void>;
  getByPrefix: (prefix: string) => Promise<unknown[]>;
  mdel: (keys: string[]) => Promise<void>;
};

export type AppDeps = {
  kv: KvStore;
  checkRateLimit: (key: string, maxPerWindow: number) => Promise<boolean>;
};

export function createDepsMiddleware(deps: AppDeps): MiddlewareHandler {
  return async (c, next) => {
    c.set("kv", deps.kv);
    c.set("checkRateLimit", deps.checkRateLimit);
    await next();
  };
}
