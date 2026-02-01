/**
 * VisuDEV Edge Function: Code Analyzer (DDD/DI Refactor)
 *
 * @version 4.0.0
 * @description GitHub code analysis + optional DB introspection + screenshots
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@jsr/supabase__supabase-js";
import { createAnalyzerModule } from "./module/index.ts";
import type {
  AnalyzerAnthropicConfig,
  AnalyzerScreenshotConfig,
  LoggerLike,
} from "./module/interfaces/module.interface.ts";
import { ModuleException } from "./module/internal/exceptions/index.ts";
import type { ErrorResponse } from "./module/types/index.ts";

interface EnvConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  kvTableName: string;
  githubApiBaseUrl: string;
  analysisFileLimit: number;
  analysisProgressLogEvery: number;
  fallbackRoutes: Array<{ path: string; name: string }>;
  screenshot: AnalyzerScreenshotConfig;
  anthropic: AnalyzerAnthropicConfig;
}

const DEFAULT_FALLBACK_ROUTES = [
  { path: "/", name: "Home" },
  { path: "/projects", name: "Projects" },
  { path: "/gym", name: "Gym" },
  { path: "/worlds", name: "Worlds" },
];

const app = new Hono().basePath("/visudev-analyzer");

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

const logger: LoggerLike = createLogger();
const env = loadEnvConfig(logger);

const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);

const analyzerModule = createAnalyzerModule({
  supabase,
  logger,
  config: {
    kvTableName: env.kvTableName,
    githubApiBaseUrl: env.githubApiBaseUrl,
    analysisFileLimit: env.analysisFileLimit,
    analysisProgressLogEvery: env.analysisProgressLogEvery,
    fallbackRoutes: env.fallbackRoutes,
    screenshot: env.screenshot,
    anthropic: env.anthropic,
  },
});

analyzerModule.registerRoutes(app);

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
    return c.json(payload, err.statusCode);
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
  return c.json(payload, 500);
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

  const kvTableName = Deno.env.get("VISUDEV_KV_TABLE") ??
    Deno.env.get("KV_TABLE_NAME") ?? "kv_store_edf036ef";

  if (!Deno.env.get("VISUDEV_KV_TABLE") && !Deno.env.get("KV_TABLE_NAME")) {
    loggerInstance.warn("KV table env not set. Falling back to default.", {
      defaultValue: kvTableName,
    });
  }

  const githubApiBaseUrl = Deno.env.get("GITHUB_API_BASE_URL") ??
    "https://api.github.com";
  const analysisFileLimit = Math.max(
    0,
    parseNumberEnv("VISUDEV_ANALYZER_FILE_LIMIT", 150),
  );
  const analysisProgressLogEvery = Math.max(
    0,
    parseNumberEnv("VISUDEV_ANALYZER_PROGRESS_EVERY", 20),
  );

  const fallbackRoutes = parseFallbackRoutes(
    Deno.env.get("VISUDEV_ANALYZER_FALLBACK_ROUTES") ??
      Deno.env.get("ANALYZER_FALLBACK_ROUTES"),
  );

  const screenshot: AnalyzerScreenshotConfig = {
    apiBaseUrl: Deno.env.get("SCREENSHOT_API_BASE_URL") ??
      Deno.env.get("SCREENSHOTONE_API_BASE_URL") ??
      "https://api.screenshotone.com/take",
    apiKey: Deno.env.get("SCREENSHOT_API_KEY") ?? undefined,
    bucketName: Deno.env.get("VISUDEV_SCREENSHOT_BUCKET") ??
      Deno.env.get("SCREENSHOT_BUCKET_NAME") ??
      "make-edf036ef-screenshots",
    viewportWidth: Math.max(
      1,
      parseNumberEnv("SCREENSHOT_VIEWPORT_WIDTH", 1280),
    ),
    viewportHeight: Math.max(
      1,
      parseNumberEnv("SCREENSHOT_VIEWPORT_HEIGHT", 1024),
    ),
    deviceScaleFactor: Math.max(
      1,
      parseNumberEnv("SCREENSHOT_DEVICE_SCALE_FACTOR", 2),
    ),
    imageQuality: Math.max(1, parseNumberEnv("SCREENSHOT_IMAGE_QUALITY", 80)),
    format: Deno.env.get("SCREENSHOT_FORMAT") ?? "jpg",
    blockAds: parseBooleanEnv("SCREENSHOT_BLOCK_ADS", true),
    blockCookieBanners: parseBooleanEnv(
      "SCREENSHOT_BLOCK_COOKIE_BANNERS",
      true,
    ),
    blockTrackers: parseBooleanEnv("SCREENSHOT_BLOCK_TRACKERS", true),
    cacheTtlSeconds: Math.max(
      0,
      parseNumberEnv("SCREENSHOT_CACHE_TTL_SECONDS", 2_592_000),
    ),
    delayMs: Math.max(0, parseNumberEnv("SCREENSHOT_DELAY_MS", 500)),
    signedUrlTtlSeconds: Math.max(
      0,
      parseNumberEnv("SCREENSHOT_SIGNED_URL_TTL_SECONDS", 31_536_000),
    ),
  };

  const anthropic: AnalyzerAnthropicConfig = {
    apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? undefined,
    apiBaseUrl: Deno.env.get("ANTHROPIC_API_BASE_URL") ??
      "https://api.anthropic.com/v1/messages",
    model: Deno.env.get("ANTHROPIC_MODEL") ?? "claude-3-5-sonnet-20241022",
    maxTokens: Math.max(1, parseNumberEnv("ANTHROPIC_MAX_TOKENS", 2000)),
    version: Deno.env.get("ANTHROPIC_VERSION") ?? "2023-06-01",
  };

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    kvTableName,
    githubApiBaseUrl,
    analysisFileLimit,
    analysisProgressLogEvery,
    fallbackRoutes,
    screenshot,
    anthropic,
  };
}

function parseFallbackRoutes(
  value: string | undefined,
): Array<{ path: string; name: string }> {
  if (!value) {
    return DEFAULT_FALLBACK_ROUTES;
  }

  try {
    const parsed = JSON.parse(value) as Array<{ path?: string; name?: string }>;
    if (!Array.isArray(parsed)) {
      return DEFAULT_FALLBACK_ROUTES;
    }

    return parsed
      .filter((route) =>
        typeof route.path === "string" && typeof route.name === "string"
      )
      .map((route) => ({
        path: route.path as string,
        name: route.name as string,
      }));
  } catch {
    return DEFAULT_FALLBACK_ROUTES;
  }
}

function parseNumberEnv(key: string, fallback: number): number {
  const raw = Deno.env.get(key);
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}

function parseBooleanEnv(key: string, fallback: boolean): boolean {
  const raw = Deno.env.get(key);
  if (!raw) {
    return fallback;
  }

  const normalized = raw.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function getRequiredEnv(key: string): string {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`${key} environment variable is required`);
  }
  return value;
}
