/**
 * VisuDEV Edge Function: Screenshot Capture (DDD/DI Refactor)
 *
 * @version 3.0.0
 * @description Captures screenshots via external Screenshot API (ScreenshotOne)
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@jsr/supabase__supabase-js";
import { createScreenshotsModule } from "./module/index.ts";
import type { LoggerLike } from "./module/interfaces/module.interface.ts";
import { ModuleException } from "./module/internal/exceptions/index.ts";
import type { ErrorResponse } from "./module/types/index.ts";

interface EnvConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  apiKey?: string;
  apiBaseUrl: string;
  bucketName: string;
  bucketPublic: boolean;
  format: string;
  viewportWidth: number;
  viewportHeight: number;
  deviceScaleFactor: number;
  fullPage: boolean;
  delaySeconds: number;
}

const app = new Hono({ strict: false }).basePath("/visudev-screenshots");

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

const logger: LoggerLike = createLogger();
const env = loadEnvConfig(logger);

const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);

const screenshotsModule = createScreenshotsModule({
  supabase,
  logger,
  config: {
    apiKey: env.apiKey,
    apiBaseUrl: env.apiBaseUrl,
    bucketName: env.bucketName,
    bucketPublic: env.bucketPublic,
    format: env.format,
    viewportWidth: env.viewportWidth,
    viewportHeight: env.viewportHeight,
    deviceScaleFactor: env.deviceScaleFactor,
    fullPage: env.fullPage,
    delaySeconds: env.delaySeconds,
  },
});

screenshotsModule.registerRoutes(app);

app.onError((err, c) => {
  if (err instanceof ModuleException) {
    logger.warn("Request failed", { code: err.code, message: err.message });
    const payload: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    };
    return c.json({ ...payload, screenshots: [] }, err.statusCode);
  }

  const message = err instanceof Error ? err.message : "Unknown error";
  logger.error("Unhandled error", { message });
  const payload: ErrorResponse = {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message,
    },
  };
  return c.json({ ...payload, screenshots: [] }, 500);
});

Deno.serve(app.fetch);

function createLogger(): LoggerLike {
  const encoder = new TextEncoder();
  const write = (
    stream: "stdout" | "stderr",
    payload: Record<string, unknown>,
  ): void => {
    const line = JSON.stringify(payload);
    const data = encoder.encode(`${line}\n`);
    if (stream === "stderr") {
      Deno.stderr.writeSync(data);
      return;
    }
    Deno.stdout.writeSync(data);
  };

  return {
    info: (message: string, meta?: Record<string, unknown>): void => {
      write("stdout", {
        level: "info",
        message,
        meta,
        ts: new Date().toISOString(),
      });
    },
    warn: (message: string, meta?: Record<string, unknown>): void => {
      write("stderr", {
        level: "warn",
        message,
        meta,
        ts: new Date().toISOString(),
      });
    },
    error: (message: string, meta?: Record<string, unknown>): void => {
      write("stderr", {
        level: "error",
        message,
        meta,
        ts: new Date().toISOString(),
      });
    },
    debug: (message: string, meta?: Record<string, unknown>): void => {
      write("stdout", {
        level: "debug",
        message,
        meta,
        ts: new Date().toISOString(),
      });
    },
  };
}

function loadEnvConfig(loggerInstance: LoggerLike): EnvConfig {
  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const apiKey = Deno.env.get("SCREENSHOT_API_KEY") ?? undefined;
  const apiBaseUrl = Deno.env.get("SCREENSHOT_API_BASE_URL") ??
    Deno.env.get("SCREENSHOTONE_API_BASE_URL") ??
    "https://api.screenshotone.com/take";

  if (
    !Deno.env.get("SCREENSHOT_API_BASE_URL") &&
    !Deno.env.get("SCREENSHOTONE_API_BASE_URL")
  ) {
    loggerInstance.warn(
      "Screenshot API base URL not set. Falling back to default.",
      {
        defaultValue: apiBaseUrl,
      },
    );
  }

  const bucketName = Deno.env.get("VISUDEV_SCREENSHOT_BUCKET") ??
    Deno.env.get("SCREENSHOT_BUCKET_NAME") ??
    "visudev-screens";

  if (
    !Deno.env.get("VISUDEV_SCREENSHOT_BUCKET") &&
    !Deno.env.get("SCREENSHOT_BUCKET_NAME")
  ) {
    loggerInstance.warn(
      "Screenshot bucket env not set. Falling back to default.",
      {
        defaultValue: bucketName,
      },
    );
  }

  const bucketPublic = parseBooleanEnv("SCREENSHOT_BUCKET_PUBLIC", true);
  const format = Deno.env.get("SCREENSHOT_FORMAT") ?? "png";
  const viewportWidth = Math.max(
    1,
    parseNumberEnv("SCREENSHOT_VIEWPORT_WIDTH", 1440),
  );
  const viewportHeight = Math.max(
    1,
    parseNumberEnv("SCREENSHOT_VIEWPORT_HEIGHT", 900),
  );
  const deviceScaleFactor = Math.max(
    1,
    parseNumberEnv("SCREENSHOT_DEVICE_SCALE_FACTOR", 1),
  );
  const fullPage = parseBooleanEnv("SCREENSHOT_FULL_PAGE", false);
  const delaySeconds = Math.max(
    0,
    parseNumberEnv("SCREENSHOT_DELAY_SECONDS", 1),
  );

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    apiKey,
    apiBaseUrl,
    bucketName,
    bucketPublic,
    format,
    viewportWidth,
    viewportHeight,
    deviceScaleFactor,
    fullPage,
    delaySeconds,
  };
}

function getRequiredEnv(key: string): string {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`${key} environment variable is required`);
  }
  return value;
}

function parseNumberEnv(key: string, fallback: number): number {
  const raw = Deno.env.get(key);
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBooleanEnv(key: string, fallback: boolean): boolean {
  const raw = Deno.env.get(key);
  if (!raw) {
    return fallback;
  }
  const normalized = raw.toLowerCase().trim();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}
