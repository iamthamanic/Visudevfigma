import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { warnNonFatal } from "./build-logging.js";

const APP_DIR_HINTS = [
  "frontend",
  "client",
  "web",
  "app",
  "apps/web",
  "apps/frontend",
  "packages/web",
  "packages/frontend",
];
const BACKEND_DIR_HINTS = [
  "backend",
  "server",
  "api",
  "services",
  "workers",
  "supabase",
  "functions",
  "deployment",
  "infra",
];
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
  if (!pkg || typeof pkg !== "object") return { pkg: null, scripts: null };
  const scripts = pkg.scripts && typeof pkg.scripts === "object" ? pkg.scripts : null;
  return { pkg, scripts };
}

function hasScript(scripts, name) {
  return scripts && typeof scripts[name] === "string" && scripts[name].trim() !== "";
}

export function normalizeRelativeDir(input) {
  if (typeof input !== "string") return null;
  const raw = input.trim().replace(/\\/g, "/");
  if (!raw || raw === ".") return null;
  const cleaned = raw.replace(/^\.\/+/, "").replace(/^\/+|\/+$/g, "");
  if (!cleaned || cleaned.includes("..")) return null;
  return cleaned;
}

function hasFrontendSignalInPackageJson(pkg) {
  if (!pkg || typeof pkg !== "object") return false;
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const keys = Object.keys(deps);
  return keys.some((key) =>
    ["react", "next", "vite", "vue", "nuxt", "svelte", "@angular/core", "react-router"].includes(
      key,
    ),
  );
}

function safeReadDir(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    warnNonFatal(`safeReadDir failed (${dir})`, error);
    return [];
  }
}

function collectPackageJsonDirs(workspaceDir) {
  const dirs = new Set();
  const addDir = (dir) => {
    if (!dir) return;
    if (existsSync(join(dir, "package.json"))) dirs.add(dir);
  };

  addDir(workspaceDir);
  for (const hint of APP_DIR_HINTS) {
    addDir(join(workspaceDir, hint));
  }

  const rootEntries = safeReadDir(workspaceDir);
  for (const entry of rootEntries) {
    if (!entry.isDirectory()) continue;
    addDir(join(workspaceDir, entry.name));
    if (entry.name === "apps" || entry.name === "packages") {
      const nestedEntries = safeReadDir(join(workspaceDir, entry.name));
      for (const nested of nestedEntries) {
        if (!nested.isDirectory()) continue;
        addDir(join(workspaceDir, entry.name, nested.name));
      }
    }
  }

  return Array.from(dirs);
}

function getCandidateScore(workspaceDir, dir, scripts, pkg) {
  let score = 0;
  const rel = relative(workspaceDir, dir).replace(/\\/g, "/") || ".";
  const relLower = rel.toLowerCase();
  const hasBuild = hasScript(scripts, "build");
  const hasDev = hasScript(scripts, "dev");
  const hasStart = hasScript(scripts, "start");
  const hasAnyRuntimeScript = hasBuild || hasDev || hasStart;

  if (!hasAnyRuntimeScript) return -9999;
  if (rel === ".") score += 20;
  if (hasBuild) score += 30;
  if (hasDev) score += 22;
  if (hasStart) score += 14;
  if (hasFrontendSignalInPackageJson(pkg)) score += 20;

  const hintIndex = APP_DIR_HINTS.findIndex((hint) => hint.toLowerCase() === relLower);
  if (hintIndex >= 0) {
    score += 120 - hintIndex;
  } else if (
    relLower.includes("frontend") ||
    relLower.includes("/web") ||
    relLower.startsWith("web/")
  ) {
    score += 60;
  }

  if (BACKEND_DIR_HINTS.some((token) => relLower === token || relLower.includes(`/${token}/`))) {
    score -= 80;
  }

  return score;
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
  const { pkg } = readScriptsFromPackageJson(appDir);
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

function buildCandidateRecord(workspaceDir, dir, scripts, pkg, score, source = "scan") {
  const appDirRelative = relative(workspaceDir, dir).replace(/\\/g, "/") || ".";
  return {
    appDir: dir,
    appDirRelative,
    source,
    score,
    scripts: {
      build: hasScript(scripts, "build"),
      dev: hasScript(scripts, "dev"),
      start: hasScript(scripts, "start"),
    },
    frameworkHint: hasFrontendSignalInPackageJson(pkg) ? "frontend" : "unknown",
  };
}

export function listPreviewCandidates(workspaceDir, config = null, maxCandidates = 10) {
  const normalizedMaxCandidates =
    Number.isFinite(maxCandidates) && Number(maxCandidates) > 0 ? Number(maxCandidates) : 10;
  const records = [];
  const seen = new Set();

  const configuredRel = normalizeRelativeDir(config?.appDirectory);
  if (configuredRel) {
    const configuredDir = join(workspaceDir, configuredRel);
    if (existsSync(join(configuredDir, "package.json"))) {
      const { pkg, scripts } = readScriptsFromPackageJson(configuredDir);
      const score = Math.max(getCandidateScore(workspaceDir, configuredDir, scripts, pkg), 9_999);
      records.push(
        buildCandidateRecord(workspaceDir, configuredDir, scripts, pkg, score, "config"),
      );
      seen.add(configuredDir);
    }
  }

  const scanned = collectPackageJsonDirs(workspaceDir)
    .map((dir) => {
      const { pkg, scripts } = readScriptsFromPackageJson(dir);
      return {
        dir,
        scripts,
        pkg,
        score: getCandidateScore(workspaceDir, dir, scripts, pkg),
      };
    })
    .filter((item) => Number.isFinite(item.score) && item.score > -9999)
    .sort((a, b) => b.score - a.score);

  for (const item of scanned) {
    if (seen.has(item.dir)) continue;
    records.push(buildCandidateRecord(workspaceDir, item.dir, item.scripts, item.pkg, item.score));
    seen.add(item.dir);
  }

  if (records.length === 0) {
    records.push({
      appDir: workspaceDir,
      appDirRelative: ".",
      source: "root-fallback",
      score: -10000,
      scripts: { build: false, dev: false, start: false },
      frameworkHint: "unknown",
    });
  }

  return records.slice(0, normalizedMaxCandidates);
}

export function resolveAppWorkspaceDir(workspaceDir, config = null) {
  const [first] = listPreviewCandidates(workspaceDir, config, 1);
  if (!first) {
    return { appDir: workspaceDir, appDirRelative: ".", source: "root-fallback" };
  }
  return {
    appDir: first.appDir,
    appDirRelative: first.appDirRelative,
    source: first.source,
    score: first.score,
    scripts: first.scripts,
    frameworkHint: first.frameworkHint,
  };
}
