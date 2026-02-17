import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { warnNonFatal } from "./build-logging.js";

const SCAN_SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".nuxt",
  "coverage",
  ".turbo",
]);
const SUPABASE_SCAN_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".env",
  ".md",
  ".yaml",
  ".yml",
]);
const SUPABASE_SCAN_MAX_FILES = 250;
const SUPABASE_SCAN_MAX_DEPTH = 6;
const SUPABASE_SCAN_MAX_BYTES = 64 * 1024;
const DEV_ENV_FILES = [".env", ".env.local", ".env.development", ".env.development.local"];

function safeReadJson(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    warnNonFatal(`safeReadJson failed (${filePath})`, error);
    return null;
  }
}

function readScriptsFromPackageJson(dir) {
  const pkg = safeReadJson(join(dir, "package.json"));
  return pkg && typeof pkg === "object" ? pkg : null;
}

function safeReadDir(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    warnNonFatal(`safeReadDir failed (${dir})`, error);
    return [];
  }
}

function safeReadText(filePath, maxBytes) {
  if (!existsSync(filePath)) return "";
  try {
    const stat = statSync(filePath);
    if (stat.size > maxBytes) return "";
    return readFileSync(filePath, "utf8");
  } catch (error) {
    warnNonFatal(`safeReadText failed (${filePath})`, error);
    return "";
  }
}

export function detectSupabaseUsage(appDir) {
  const pkg = readScriptsFromPackageJson(appDir);
  const deps = pkg
    ? {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      }
    : {};
  const depKeys = Object.keys(deps);
  if (
    depKeys.some((key) =>
      ["@supabase/supabase-js", "@supabase/ssr", "supabase"].includes(String(key).toLowerCase()),
    )
  ) {
    return true;
  }

  for (const envFile of DEV_ENV_FILES) {
    const text = safeReadText(join(appDir, envFile), SUPABASE_SCAN_MAX_BYTES);
    if (
      text &&
      /(VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY|SUPABASE_URL|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY)/i.test(
        text,
      )
    ) {
      return true;
    }
  }

  const queue = [{ dir: appDir, depth: 0 }];
  let scannedFiles = 0;

  while (queue.length > 0 && scannedFiles < SUPABASE_SCAN_MAX_FILES) {
    const current = queue.shift();
    if (!current) break;
    if (current.depth > SUPABASE_SCAN_MAX_DEPTH) continue;

    for (const entry of safeReadDir(current.dir)) {
      if (entry.isDirectory()) {
        if (SCAN_SKIP_DIRS.has(entry.name)) continue;
        queue.push({
          dir: join(current.dir, entry.name),
          depth: current.depth + 1,
        });
        continue;
      }

      if (!entry.isFile()) continue;
      scannedFiles++;
      const filePath = join(current.dir, entry.name);
      const dot = entry.name.lastIndexOf(".");
      const ext = dot >= 0 ? entry.name.slice(dot).toLowerCase() : "";
      if (!SUPABASE_SCAN_EXTS.has(ext)) continue;
      if (entry.name.toLowerCase().includes("supabase")) return true;
      const text = safeReadText(filePath, SUPABASE_SCAN_MAX_BYTES);
      if (!text) continue;
      if (
        /\b(createClient|supabase)\b|VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY|SUPABASE_URL|SUPABASE_ANON_KEY/i.test(
          text,
        )
      ) {
        return true;
      }
    }
  }

  return false;
}
