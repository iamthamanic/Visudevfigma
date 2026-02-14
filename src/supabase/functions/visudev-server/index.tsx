/**
 * visudev-server: HTTP routing only. Domain logic in lib/ and routes/.
 * SRP: index.tsx mounts routes; composition root injects deps into middleware.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { kv } from "./lib/kv.ts";
import { createCheckRateLimit } from "./lib/rate-limit.ts";
import { type AppDeps, createDepsMiddleware } from "./lib/deps-middleware.ts";
import { projectsRouter } from "./routes/projects.ts";
import { appflowRouter } from "./routes/appflow.ts";
import { blueprintRouter } from "./routes/blueprint.ts";
import { dataRouter } from "./routes/data.ts";
import { logsRouter } from "./routes/logs.ts";
import { accountRouter } from "./routes/account.ts";
import { integrationsRouter } from "./routes/integrations.ts";
import { scansRouter } from "./routes/scans.ts";

const deps: AppDeps = {
  kv,
  checkRateLimit: createCheckRateLimit(kv),
  logError: (msg: string, err?: unknown) => {
    console.log(msg);
    if (err != null && typeof (err as Error).message === "string") {
      console.log((err as Error).message);
    }
  },
};

const app = new Hono<{ Variables: AppDeps }>();

app.use("*", logger(console.log));
app.use("*", createDepsMiddleware(deps));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/projects", projectsRouter);
app.route("/appflow", appflowRouter);
app.route("/blueprint", blueprintRouter);
app.route("/data", dataRouter);
app.route("/logs", logsRouter);
app.route("/account", accountRouter);
app.route("/integrations", integrationsRouter);
app.route("/scans", scansRouter);

Deno.serve(app.fetch);
