/**
 * Health and capabilities routes for Local Engine.
 * Location: local-engine/src/routes/health.routes.ts
 */

import type { Hono } from "hono";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ENGINE_VERSION } from "../config.js";
import type { EngineConfig } from "../config.js";
import { fail, ok } from "./http.js";

const execFileAsync = promisify(execFile);

async function checkRunner(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/health`, {
      signal: AbortSignal.timeout(1500),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkDeno(): Promise<{ available: boolean; version: string | null }> {
  try {
    const { stdout } = await execFileAsync("deno", ["--version"], { timeout: 3000 });
    const firstLine = stdout.split("\n")[0] ?? "";
    return { available: true, version: firstLine.replace(/^deno\s+/i, "").trim() || null };
  } catch {
    return { available: false, version: null };
  }
}

export function registerHealthRoutes(app: Hono, config: EngineConfig): void {
  app.get("/health", async (c) => {
    const details = c.req.query("details") === "1" || c.req.query("strict") === "1";
    if (!details) {
      return ok(c, {
        ok: true,
        service: "visudev-local-engine",
        mode: "local",
        version: ENGINE_VERSION,
      });
    }

    const [runnerReachable, deno] = await Promise.all([
      checkRunner(config.previewRunnerUrl),
      checkDeno(),
    ]);

    return ok(c, {
      ok: true,
      service: "visudev-local-engine",
      mode: "local",
      version: ENGINE_VERSION,
      dependencies: {
        previewRunner: { reachable: runnerReachable, url: config.previewRunnerUrl },
        deno: { ...deno, requiredFor: ["blueprint", "appflow"] },
      },
    });
  });

  app.get("/api/capabilities", (c) =>
    ok(c, {
      mode: "local",
      scans: {
        blueprint: true,
        appflow: true,
        data: true,
        all: false,
      },
      preview: true,
      browseLocalPath: true,
    }),
  );

  app.get("/api/health", async (c) => {
    const base = await app.request(new Request(`${c.req.url.split("/api")[0]}/health?details=1`));
    if (!base.ok) return fail(c, "HEALTH_CHECK_FAILED", "Health check failed", 500);
    const payload = (await base.json()) as { ok: boolean; data?: unknown };
    if (!payload.ok) return fail(c, "HEALTH_CHECK_FAILED", "Health check failed", 500);
    return c.json(payload);
  });
}
