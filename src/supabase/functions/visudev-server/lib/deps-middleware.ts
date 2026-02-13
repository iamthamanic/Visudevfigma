/**
 * Dependency injection middleware. Injects kv and checkRateLimit into Hono context
 * so routes receive them via c.get() instead of importing. Supports testability
 * and aligns with dependency inversion.
 */
import type { MiddlewareHandler } from "hono";
import { kv } from "./kv.ts";
import { createCheckRateLimit } from "./rate-limit.ts";

const checkRateLimit = createCheckRateLimit(kv);

export type AppDeps = {
  kv: typeof kv;
  checkRateLimit: typeof checkRateLimit;
};

export const depsMiddleware: MiddlewareHandler = async (c, next) => {
  c.set("kv", kv);
  c.set("checkRateLimit", checkRateLimit);
  await next();
};
