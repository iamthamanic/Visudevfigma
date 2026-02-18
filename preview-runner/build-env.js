import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { warnNonFatal } from "./build-logging.js";
import { detectSupabaseUsage } from "./build-supabase-scan.js";

const DEV_ENV_FILES = [".env", ".env.local", ".env.development", ".env.development.local"];
const SUPABASE_PREVIEW_PLACEHOLDERS = {
  VITE_SUPABASE_URL: "http://127.0.0.1:54321",
  VITE_SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.preview.eyJyb2xlIjoiYW5vbiJ9.preview",
};

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isValidEnvKey(key) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key);
}

export function sanitizePreviewEnv(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!isValidEnvKey(k)) continue;
    if (typeof v !== "string") continue;
    out[k] = v;
  }
  return out;
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const out = {};
  try {
    const text = readFileSync(filePath, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const withoutExport = line.startsWith("export ") ? line.slice(7).trim() : line;
      const eq = withoutExport.indexOf("=");
      if (eq <= 0) continue;
      const key = withoutExport.slice(0, eq).trim();
      let value = withoutExport.slice(eq + 1).trim();
      if (!isValidEnvKey(key)) continue;
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      out[key] = value;
    }
  } catch (error) {
    warnNonFatal(`parseEnvFile failed (${filePath})`, error);
  }
  return out;
}

function readDevEnvFromFiles(workspaceDir) {
  const merged = {};
  for (const rel of DEV_ENV_FILES) {
    const parsed = parseEnvFile(join(workspaceDir, rel));
    Object.assign(merged, parsed);
  }
  return merged;
}

export function resolveStartEnv(workspaceDir, config) {
  const env = sanitizePreviewEnv(config?.previewEnv);
  const injectedKeys = [];
  const workspaceRoot =
    typeof config?.workspaceRoot === "string" && config.workspaceRoot.trim() !== ""
      ? config.workspaceRoot
      : workspaceDir;
  const devEnv = {
    ...readDevEnvFromFiles(workspaceRoot),
    ...(workspaceRoot === workspaceDir ? {} : readDevEnvFromFiles(workspaceDir)),
  };
  const supabaseDetected = detectSupabaseUsage(workspaceDir);
  const explicitPlaceholderFlag = config?.injectSupabasePlaceholders;
  const allowSupabasePlaceholders =
    typeof explicitPlaceholderFlag === "boolean" ? explicitPlaceholderFlag : supabaseDetected;
  const placeholderMode =
    typeof explicitPlaceholderFlag === "boolean"
      ? explicitPlaceholderFlag
        ? "forced_on"
        : "forced_off"
      : supabaseDetected
        ? "auto_detected"
        : "auto_disabled";

  if (allowSupabasePlaceholders) {
    for (const [key, value] of Object.entries(SUPABASE_PREVIEW_PLACEHOLDERS)) {
      const alreadyDefined =
        isNonEmptyString(process.env[key]) ||
        isNonEmptyString(env[key]) ||
        isNonEmptyString(devEnv[key]);
      if (!alreadyDefined) {
        env[key] = value;
        injectedKeys.push(key);
      }
    }
  }

  return { env, injectedKeys, placeholderMode, supabaseDetected };
}
