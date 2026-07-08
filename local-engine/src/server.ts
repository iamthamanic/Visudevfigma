/**
 * Hono server bootstrap for VisuDEV Local Engine.
 * Location: local-engine/src/server.ts
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import fs from "node:fs/promises";
import path from "node:path";
import { getEngineConfig, type EngineConfig } from "./config.js";
import { ensureVisuDevDir, readJsonFile, writeJsonFile } from "./storage/file-store.js";
import { LocalPreviewRunnerProvider } from "./providers/local-preview-runner.provider.js";
import { ProjectService } from "./services/project.service.js";
import { AnalysisService } from "./services/analysis.service.js";
import { PreviewService } from "./services/preview.service.js";
import { registerHealthRoutes } from "./routes/health.routes.js";
import { registerProjectRoutes } from "./routes/projects.routes.js";
import { registerAnalysisRoutes } from "./routes/analysis.routes.js";
import { registerPreviewRoutes } from "./routes/preview.routes.js";
import { registerLocalPathRoutes } from "./routes/local-path.routes.js";

async function acquireEngineLock(storageDir: string, port: number): Promise<void> {
  const lockPath = path.join(storageDir, "engine.lock");
  const existing = await readJsonFile<{ pid?: number } | null>(lockPath, null);
  if (existing?.pid) {
    try {
      process.kill(existing.pid, 0);
      throw new Error(`Another Local Engine instance is already running (pid ${existing.pid}).`);
    } catch (error) {
      if (error instanceof Error && error.message.includes("already running")) {
        throw error;
      }
    }
  }
  await writeJsonFile(lockPath, {
    pid: process.pid,
    startedAt: new Date().toISOString(),
    port,
  });
}

export async function createApp(config: EngineConfig = getEngineConfig()) {
  await ensureVisuDevDir(config.storageDir);
  await acquireEngineLock(config.storageDir, config.port);

  const previewProvider = new LocalPreviewRunnerProvider(
    config.previewRunnerUrl,
    config.storageDir,
  );
  const projectService = new ProjectService(config.storageDir, previewProvider);
  await projectService.init();
  const analysisService = new AnalysisService(
    config.storageDir,
    projectService,
    config.previewRunnerUrl,
    config.analysisProvider,
  );
  const previewService = new PreviewService(projectService, previewProvider);

  const baseUrl = `http://${config.host}:${config.port}`;
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) return config.allowedOrigins[0] ?? "http://localhost:3005";
        return config.allowedOrigins.includes(origin) ? origin : config.allowedOrigins[0];
      },
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  registerHealthRoutes(app, config);
  registerProjectRoutes(app, projectService);
  registerAnalysisRoutes(app, analysisService, baseUrl);
  registerPreviewRoutes(app, previewService);
  registerLocalPathRoutes(app, config);

  return { app, config };
}

export async function startServer(config: EngineConfig = getEngineConfig()) {
  const { serve } = await import("@hono/node-server");
  const { app, config: resolved } = await createApp(config);
  const server = serve({
    fetch: app.fetch,
    hostname: resolved.host,
    port: resolved.port,
  });

  console.warn(
    `[visudev-local-engine] listening on http://${resolved.host}:${resolved.port} (storage: ${resolved.storageDir})`,
  );

  const shutdown = async () => {
    try {
      await fs.rm(path.join(resolved.storageDir, "engine.lock"), { force: true });
    } catch {
      /* ignore */
    }
    server.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());

  return server;
}
