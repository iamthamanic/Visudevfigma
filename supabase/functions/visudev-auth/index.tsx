/**
 * VisuDEV Edge Function: Authentication (DDD/DI Refactor)
 *
 * @version 2.0.0
 * @description OAuth flow for GitHub and Supabase integrations
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@jsr/supabase__supabase-js";
import { createAuthModule } from "./module/index.ts";
import type { LoggerLike } from "./module/interfaces/module.interface.ts";
import { ModuleException } from "./module/internal/exceptions/index.ts";
import type { ErrorResponse } from "./module/types/index.ts";

interface EnvConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  kvTableName: string;
  githubClientId?: string;
  githubClientSecret?: string;
  githubRedirectUri: string;
  githubOAuthBaseUrl: string;
  githubApiBaseUrl: string;
  githubScope: string;
  githubDefaultReturnUrl: string;
  supabaseApiBaseUrl: string;
}

const app = new Hono().basePath("/visudev-auth");

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

const authModule = createAuthModule({
  supabase,
  logger,
  config: {
    kvTableName: env.kvTableName,
    githubClientId: env.githubClientId,
    githubClientSecret: env.githubClientSecret,
    githubRedirectUri: env.githubRedirectUri,
    githubOAuthBaseUrl: env.githubOAuthBaseUrl,
    githubApiBaseUrl: env.githubApiBaseUrl,
    githubScope: env.githubScope,
    githubDefaultReturnUrl: env.githubDefaultReturnUrl,
    supabaseApiBaseUrl: env.supabaseApiBaseUrl,
  },
});

authModule.registerRoutes(app);

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

  const githubClientId = Deno.env.get("GITHUB_CLIENT_ID") ?? undefined;
  const githubClientSecret = Deno.env.get("GITHUB_CLIENT_SECRET") ?? undefined;

  const githubRedirectUri = Deno.env.get("GITHUB_REDIRECT_URI") ??
    `${supabaseUrl}/functions/v1/visudev-auth/github/callback`;

  if (!Deno.env.get("GITHUB_REDIRECT_URI")) {
    loggerInstance.warn(
      "GITHUB_REDIRECT_URI not set. Falling back to default.",
      {
        defaultValue: githubRedirectUri,
      },
    );
  }

  const githubOAuthBaseUrl = Deno.env.get("GITHUB_OAUTH_BASE_URL") ??
    "https://github.com";
  if (!Deno.env.get("GITHUB_OAUTH_BASE_URL")) {
    loggerInstance.warn(
      "GITHUB_OAUTH_BASE_URL not set. Falling back to default.",
      {
        defaultValue: githubOAuthBaseUrl,
      },
    );
  }

  const githubApiBaseUrl = Deno.env.get("GITHUB_API_BASE_URL") ??
    "https://api.github.com";
  if (!Deno.env.get("GITHUB_API_BASE_URL")) {
    loggerInstance.warn(
      "GITHUB_API_BASE_URL not set. Falling back to default.",
      {
        defaultValue: githubApiBaseUrl,
      },
    );
  }

  const githubScope = Deno.env.get("GITHUB_OAUTH_SCOPE") ?? "repo,read:user";
  if (!Deno.env.get("GITHUB_OAUTH_SCOPE")) {
    loggerInstance.warn(
      "GITHUB_OAUTH_SCOPE not set. Falling back to default.",
      {
        defaultValue: githubScope,
      },
    );
  }

  const githubDefaultReturnUrl = Deno.env.get("GITHUB_DEFAULT_RETURN_URL") ??
    "https://www.figma.com/";
  if (!Deno.env.get("GITHUB_DEFAULT_RETURN_URL")) {
    loggerInstance.warn(
      "GITHUB_DEFAULT_RETURN_URL not set. Falling back to default.",
      { defaultValue: githubDefaultReturnUrl },
    );
  }

  const supabaseApiBaseUrl = Deno.env.get("SUPABASE_API_BASE_URL") ??
    "https://api.supabase.com";
  if (!Deno.env.get("SUPABASE_API_BASE_URL")) {
    loggerInstance.warn(
      "SUPABASE_API_BASE_URL not set. Falling back to default.",
      {
        defaultValue: supabaseApiBaseUrl,
      },
    );
  }

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    kvTableName,
    githubClientId,
    githubClientSecret,
    githubRedirectUri,
    githubOAuthBaseUrl,
    githubApiBaseUrl,
    githubScope,
    githubDefaultReturnUrl,
    supabaseApiBaseUrl,
  };
}

function getRequiredEnv(key: string): string {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`${key} environment variable is required`);
  }
  return value;
}
