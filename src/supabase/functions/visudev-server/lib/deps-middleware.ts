/**
 * Dependency injection middleware. Injects kv and checkRateLimit into Hono context
 * so routes use c.get() instead of importing. Factory (createDepsMiddleware) lets
 * the composition root supply deps—enables tests with a fake kv/rateLimit without
 * touching route code.
 *
 * Route handlers intentionally do param validation + authz + service call in one place
 * for traceability; we can extract param middleware (e.g. validateProjectId) if handlers grow.
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
  /** Injected logger; (message, err?) so routes don't depend on console. err is optional for diagnosis (e.g. err.message only, no stack). */
  logError: (message: string, err?: unknown) => void;
};

export function createDepsMiddleware(deps: AppDeps): MiddlewareHandler {
  return async (c, next) => {
    c.set("kv", deps.kv);
    c.set("checkRateLimit", deps.checkRateLimit);
    c.set("logError", deps.logError);
    await next();
  };
}
