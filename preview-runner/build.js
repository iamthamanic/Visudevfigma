/**
 * VisuDEV Preview Runner – Clone, Build, Start
 * Real repo clone, build, and start app on assigned port.
 * Supports refresh (git pull + rebuild + restart) for live updates.
 */

import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const WORKSPACE_ROOT = join(__dirname, "workspace");
/** Age (ms) after which index.lock is considered stale. Long clone/fetch on large repos may take > 2 min. */
const GIT_LOCK_MAX_AGE_MS = 5 * 60 * 1000;
const KNOWN_GIT_CANDIDATES = ["/usr/bin/git", "/opt/homebrew/bin/git", "/usr/local/bin/git"];
const DEV_ENV_FILES = [".env", ".env.local", ".env.development", ".env.development.local"];
const SUPABASE_PREVIEW_PLACEHOLDERS = {
  VITE_SUPABASE_URL: "http://127.0.0.1:54321",
  VITE_SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.preview.eyJyb2xlIjoiYW5vbiJ9.preview",
};
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

function sanitizeProjectId(projectId) {
  return (
    String(projectId)
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 64) || "default"
  );
}

export function getWorkspaceDir(projectId) {
  return join(WORKSPACE_ROOT, sanitizeProjectId(projectId));
}

function safeReadJson(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
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

function normalizeRelativeDir(input) {
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

function safeReadDir(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
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

function detectSupabaseUsage(appDir) {
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

function safeReadText(filePath, maxBytes) {
  if (!existsSync(filePath)) return "";
  try {
    const stat = statSync(filePath);
    if (stat.size > maxBytes) return "";
    return readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
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

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isValidEnvKey(key) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key);
}

function sanitizePreviewEnv(raw) {
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
  } catch {
    // ignore malformed env file and continue with other sources
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

function resolveStartEnv(workspaceDir, config) {
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

/** Resolve a real git binary and avoid local shim wrappers (e.g. ~/.local/bin/git -> shimwrappercheck). */
function resolveGitBinary() {
  const explicit = process.env.SHIM_GIT_REAL_BIN;
  if (explicit && existsSync(explicit)) return explicit;

  const pathEntries = String(process.env.PATH || "")
    .split(":")
    .filter(Boolean);
  for (const dir of pathEntries) {
    if (dir.includes("/.local/bin")) continue;
    const candidate = join(dir, "git");
    if (existsSync(candidate)) return candidate;
  }

  for (const candidate of KNOWN_GIT_CANDIDATES) {
    if (existsSync(candidate)) return candidate;
  }
  return "git";
}

/** Repo: "owner/repo". Returns clone URL (with token if GITHUB_TOKEN set). */
function getCloneUrl(repo) {
  const token = process.env.GITHUB_TOKEN;
  const base = `https://github.com/${repo}.git`;
  if (token && token.trim()) {
    return base.replace("https://", `https://x-access-token:${token.trim()}@`);
  }
  return base;
}

function runCommand(cwd, command, env = {}) {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === "win32";
    const child = spawn(isWin ? "cmd" : "sh", [isWin ? "/c" : "-c", command], {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    let stdout = "";
    child.stdout?.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `Exit ${code}`));
    });
    child.on("error", reject);
  });
}

function getGitLockPath(workspaceDir) {
  return join(workspaceDir, ".git", "index.lock");
}

function removeStaleGitLock(workspaceDir, maxAgeMs = GIT_LOCK_MAX_AGE_MS) {
  if (!workspaceDir) return false;
  const lockPath = getGitLockPath(workspaceDir);
  if (!existsSync(lockPath)) return false;
  try {
    const stats = statSync(lockPath);
    const ageMs = Date.now() - stats.mtimeMs;
    if (ageMs < maxAgeMs) return false;
    unlinkSync(lockPath);
    console.warn(`  [git] Removed stale index.lock (${Math.round(ageMs / 1000)}s old).`);
    return true;
  } catch {
    return false;
  }
}

function isGitLockError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("index.lock");
}

/** Führt Befehl mit exakten Argumenten aus (ohne Shell). Gibt Promise mit { stdout, stderr } oder Fehler. */
function runPackageManager(cwd, cmd, args, env = {}) {
  const list = Array.isArray(args) ? args.filter((a) => a != null && a !== "") : [];
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, list, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    let stdout = "";
    child.stdout?.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `${cmd} exit ${code}`));
    });
    child.on("error", reject);
  });
}

function runNpm(cwd, args, env = {}) {
  if (!Array.isArray(args) || args.filter((a) => a != null && a !== "").length === 0) {
    return Promise.reject(new Error("runNpm: args must be a non-empty array"));
  }
  return runPackageManager(cwd, "npm", args, env);
}

function runPnpm(cwd, args, env = {}) {
  if (!Array.isArray(args) || args.filter((a) => a != null && a !== "").length === 0) {
    return Promise.reject(new Error("runPnpm: args must be a non-empty array"));
  }
  return runPackageManager(cwd, "pnpm", args, env);
}

function runYarn(cwd, args, env = {}) {
  if (!Array.isArray(args) || args.filter((a) => a != null && a !== "").length === 0) {
    return Promise.reject(new Error("runYarn: args must be a non-empty array"));
  }
  return runPackageManager(cwd, "yarn", args, env);
}

function isCommandAvailable(cmd) {
  try {
    const result = spawnSync(cmd, ["--version"], {
      stdio: "ignore",
      timeout: 1500,
      windowsHide: true,
    });
    return result.status === 0;
  } catch {
    return false;
  }
}

/** Erkennt den Paketmanager anhand der Lock-Dateien (pnpm > yarn > npm). */
function getPackageManager(workspaceDir) {
  if (existsSync(join(workspaceDir, "pnpm-lock.yaml")) && isCommandAvailable("pnpm")) return "pnpm";
  if (existsSync(join(workspaceDir, "yarn.lock")) && isCommandAvailable("yarn")) return "yarn";
  return "npm";
}

const GIT_SUBCOMMANDS = new Set(["clone", "fetch", "checkout", "pull", "rev-parse", "rev-list"]);
/** Run git with args (no shell string, avoids quoting issues). */
function runGit(cwd, args, env = {}) {
  const list = Array.isArray(args) ? args.filter((a) => a != null && a !== "") : [];
  if (list.length === 0 || !GIT_SUBCOMMANDS.has(String(list[0]))) {
    throw new Error(
      "runGit: args must be a non-empty array with a valid subcommand (e.g. clone, fetch, pull)",
    );
  }
  const gitBinary = resolveGitBinary();
  return new Promise((resolve, reject) => {
    const child = spawn(gitBinary, list, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    let stdout = "";
    child.stdout?.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `git exit ${code}`));
    });
    child.on("error", reject);
  });
}

/** Clone repo (or pull if dir exists). Repo = "owner/repo", branch = "main" etc. */
export async function cloneOrPull(repo, branch, workspaceDir) {
  if (!repo || typeof repo !== "string" || !repo.includes("/")) {
    throw new Error("Ungültiges Repo-Format: erwartet 'owner/repo'");
  }
  if (!workspaceDir || typeof workspaceDir !== "string") {
    throw new Error("Workspace-Pfad fehlt oder ist ungültig");
  }
  const url = getCloneUrl(repo);
  // Erlaube nur sichere Zeichen; führende Bindestriche entfernen, damit -h/--help nicht als Git-Option gewertet werden
  let branchSafe = (branch || "main").replace(/[^a-zA-Z0-9/_.-]/g, "") || "main";
  branchSafe = branchSafe.replace(/^-+/, "") || "main";

  const attempt = async () => {
    if (!existsSync(workspaceDir)) {
      const parent = join(workspaceDir, "..");
      mkdirSync(parent, { recursive: true });
      await runGit(parent, ["clone", "--depth", "1", "-b", branchSafe, url, workspaceDir]);
      return "cloned";
    }

    await runGit(workspaceDir, ["fetch", "origin", branchSafe]);
    await runGit(workspaceDir, ["checkout", branchSafe]);
    await runGit(workspaceDir, ["pull", "origin", branchSafe, "--rebase"]);
    return "pulled";
  };

  try {
    removeStaleGitLock(workspaceDir);
    return await attempt();
  } catch (err) {
    if (isGitLockError(err) && removeStaleGitLock(workspaceDir)) {
      return await attempt();
    }
    throw err;
  }
}

/** Checkout exakt einen Commit (z. B. analysis.commitSha). Bei flachem Clone zuerst fetch --unshallow. */
export async function checkoutCommit(workspaceDir, commitSha, branchForFetch) {
  if (!workspaceDir || !existsSync(workspaceDir)) {
    throw new Error("Workspace fehlt für checkoutCommit");
  }
  const sha = String(commitSha || "").trim();
  if (!/^[a-f0-9]{40}$/i.test(sha)) {
    throw new Error("commitSha muss ein 40-stelliger Hex-Hash sein");
  }
  const branchSafe = (branchForFetch || "main").replace(/[^a-zA-Z0-9/_.-]/g, "") || "main";
  removeStaleGitLock(workspaceDir);
  try {
    await runGit(workspaceDir, ["fetch", "origin", branchSafe, "--unshallow"]);
  } catch {
    await runGit(workspaceDir, ["fetch", "origin", branchSafe]);
  }
  await runGit(workspaceDir, ["checkout", sha]);
}

/** Prüft, ob origin/branch neue Commits hat (nach fetch). Gibt true zurück, wenn Pull nötig. */
export async function hasNewCommits(workspaceDir, branch) {
  if (!workspaceDir || !existsSync(workspaceDir)) return false;
  const branchSafe =
    (branch || "main").replace(/[^a-zA-Z0-9/_.-]/g, "").replace(/^-+/, "") || "main";
  try {
    removeStaleGitLock(workspaceDir);
    await runGit(workspaceDir, ["fetch", "origin", branchSafe]);
    const { stdout } = await runGit(workspaceDir, [
      "rev-list",
      "--count",
      `HEAD..origin/${branchSafe}`,
    ]);
    return parseInt(stdout.trim(), 10) > 0;
  } catch {
    return false;
  }
}

/** Prüft, ob ein Befehl sinnvoll ist (nicht nur "npm" oder "npm -h" etc.). */
function isSaneCommand(cmd) {
  if (typeof cmd !== "string" || !cmd.trim()) return false;
  const c = cmd.trim();
  if (c === "npm" || c === "npm -h" || c === "npm --help") return false;
  if (/^npm\s+(-[a-zA-Z]|--[a-z-]+)\s*$/i.test(c)) return false;
  return true;
}

/** Prüft, ob ein package.json-Skriptwert dazu führt, dass npm die Hilfe ausgibt. */
function isBadScriptValue(value) {
  if (typeof value !== "string") return true;
  const c = value.trim();
  if (!c) return true;
  const lower = c.toLowerCase();
  if (lower === "npm" || lower === "npm -h" || lower === "npm --help") return true;
  if (/^npm\s+(-[a-zA-Z]|--[a-z-]+)\s*$/i.test(c)) return true;
  if (/^\s*npm\s*$/i.test(c)) return true;
  return false;
}

/**
 * Liest package.json im Workspace, ersetzt ungültige Skripte (z. B. nur "npm")
 * durch sichere Defaults und schreibt die Datei zurück. Verhindert "npm help"-Fehler beim Build.
 */
export function ensurePackageJsonScripts(workspaceDir) {
  const pkgPath = join(workspaceDir, "package.json");
  if (!existsSync(pkgPath)) return;
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  } catch {
    return;
  }
  const scripts = pkg.scripts;
  if (!scripts || typeof scripts !== "object") return;
  let changed = false;
  const safe = {
    build: "echo 'No build script'",
    postinstall: "",
    start: "echo 'No start script'",
    preinstall: "",
    install: "",
  };
  for (const [name, value] of Object.entries(scripts)) {
    if (isBadScriptValue(value)) {
      scripts[name] = safe[name] ?? "echo ok";
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
  }
}

/** Liest das build-Skript aus package.json (nach ensurePackageJsonScripts). */
export function getBuildScript(workspaceDir) {
  const pkgPath = join(workspaceDir, "package.json");
  if (!existsSync(pkgPath)) return null;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    const script = pkg?.scripts?.build;
    return typeof script === "string" && script.trim() ? script.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Bekannte Build-Befehle, die wir direkt mit node ausführen (ohne npm/npx), um "npm ohne Unterbefehl"-Fehler zu vermeiden.
 */
const NODE_BUILD_BINARIES = [
  { pattern: /^vite\s+build/i, bin: "node_modules/vite/bin/vite.js", args: "build" },
  {
    pattern: /^react-scripts\s+build/i,
    bin: "node_modules/react-scripts/bin/react-scripts.js",
    args: "build",
  },
  {
    pattern: /^vue-cli-service\s+build/i,
    bin: "node_modules/@vue/cli-service/bin/vue-cli-service.js",
    args: "build",
  },
];

/**
 * Install mit erkanntem Paketmanager (pnpm / yarn / npm), mit --ignore-scripts.
 */
async function installDeps(workspaceDir, pm) {
  if (pm === "pnpm") {
    await runPnpm(workspaceDir, ["install", "--ignore-scripts"]);
    return;
  }
  if (pm === "yarn") {
    await runYarn(workspaceDir, ["install", "--ignore-scripts"]);
    return;
  }
  const hasLock = existsSync(join(workspaceDir, "package-lock.json"));
  if (hasLock) {
    await runNpm(workspaceDir, ["ci", "--ignore-scripts"]);
  } else {
    await runNpm(workspaceDir, ["install", "--ignore-scripts"]);
  }
}

/**
 * Build mit erkanntem Paketmanager: zuerst node direct (vite/react-scripts/vue), sonst pm run build oder npx.
 */
async function runBuildStep(workspaceDir, pm, script) {
  if (!script || script.includes("&&") || /^\s*npm\s*$/i.test(script) || /^npm\s+/i.test(script)) {
    if (pm === "pnpm") await runPnpm(workspaceDir, ["run", "build"]);
    else if (pm === "yarn") await runYarn(workspaceDir, ["run", "build"]);
    else await runNpm(workspaceDir, ["run", "build"]);
    return;
  }
  if (script.startsWith("echo ") || script === "echo ok") {
    if (pm === "pnpm") await runPnpm(workspaceDir, ["run", "build"]);
    else if (pm === "yarn") await runYarn(workspaceDir, ["run", "build"]);
    else await runNpm(workspaceDir, ["run", "build"]);
    return;
  }
  for (const { pattern, bin, args } of NODE_BUILD_BINARIES) {
    if (pattern.test(script)) {
      const binPath = join(workspaceDir, bin);
      if (existsSync(binPath)) {
        console.log("  [build] node direct:", bin, args);
        await runCommand(workspaceDir, `node ${bin} ${args}`);
        return;
      }
      break;
    }
  }
  if (pm === "pnpm") {
    console.log("  [build] pnpm run build");
    await runPnpm(workspaceDir, ["run", "build"]);
    return;
  }
  if (pm === "yarn") {
    console.log("  [build] yarn run build");
    await runYarn(workspaceDir, ["run", "build"]);
    return;
  }
  console.log("  [build] npx fallback:", script);
  await runCommand(workspaceDir, "npx " + script);
}

/**
 * Build: Paketmanager erkennen (pnpm/yarn/npm), Install mit --ignore-scripts, dann Build (node direct oder pm run build).
 * Funktioniert für npm-, pnpm- und yarn-Repos (inkl. workspace:).
 */
export async function runBuildNodeDirect(workspaceDir) {
  const pm = getPackageManager(workspaceDir);
  console.log("  [build] package manager:", pm);
  await installDeps(workspaceDir, pm);
  const script = getBuildScript(workspaceDir);
  await runBuildStep(workspaceDir, pm, script);
}

const DEFAULT_BUILD = "npm ci --ignore-scripts && npm run build";
const DEFAULT_START = "npx serve dist";

/** Ersetzt "npm ci && ..." durch "npm ci --ignore-scripts && ...", falls noch nicht vorhanden. */
function ensureIgnoreScripts(cmd) {
  if (typeof cmd !== "string" || !cmd.trim()) return cmd;
  const c = cmd.trim();
  if (c.includes("--ignore-scripts")) return c;
  if (c.startsWith("npm ci ") && c.includes("&&")) {
    return "npm ci --ignore-scripts " + c.slice("npm ci ".length);
  }
  if (c.startsWith("npm ci&&")) {
    return "npm ci --ignore-scripts &&" + c.slice("npm ci&&".length);
  }
  return c;
}

/** Read visudev.config.json from repo root. */
export function getConfig(workspaceDir, workspaceRoot = workspaceDir) {
  const rootConfigPath = join(workspaceRoot, "visudev.config.json");
  const localConfigPath =
    workspaceDir === workspaceRoot ? null : join(workspaceDir, "visudev.config.json");
  let buildCommand = DEFAULT_BUILD;
  let startCommand = DEFAULT_START;
  let fallbackStartCommand = null;
  let previewEnv = {};
  let injectSupabasePlaceholders = null;
  let appDirectory = null;
  let port = 3000;

  const applyConfig = (configPath) => {
    if (!configPath || !existsSync(configPath)) return;
    try {
      const raw = readFileSync(configPath, "utf8");
      const config = JSON.parse(raw);
      buildCommand = isSaneCommand(config.buildCommand) ? config.buildCommand : buildCommand;
      startCommand = isSaneCommand(config.startCommand) ? config.startCommand : startCommand;
      fallbackStartCommand = isSaneCommand(config.fallbackStartCommand)
        ? config.fallbackStartCommand
        : fallbackStartCommand;
      previewEnv = { ...previewEnv, ...sanitizePreviewEnv(config.previewEnv) };
      if (typeof config.injectSupabasePlaceholders === "boolean") {
        injectSupabasePlaceholders = config.injectSupabasePlaceholders;
      }
      const normalizedAppDirectory = normalizeRelativeDir(config.appDirectory);
      if (normalizedAppDirectory) {
        appDirectory = normalizedAppDirectory;
      }
      if (Number(config.port) === config.port) port = config.port;
    } catch {
      // use defaults
    }
  };

  applyConfig(rootConfigPath);
  applyConfig(localConfigPath);

  buildCommand = ensureIgnoreScripts(buildCommand);
  return {
    buildCommand,
    startCommand,
    fallbackStartCommand,
    previewEnv,
    injectSupabasePlaceholders,
    appDirectory,
    workspaceRoot,
    port,
  };
}

/**
 * Resolve start command for best-effort preview when build fails.
 * Priority:
 * 1) visudev.config.json -> fallbackStartCommand
 * 2) package.json scripts.dev
 * 3) package.json scripts.start
 * 4) npx vite (if vite binary exists)
 */
export function resolveBestEffortStartCommand(workspaceDir, config = null) {
  if (config && isSaneCommand(config.fallbackStartCommand)) {
    return config.fallbackStartCommand.trim();
  }

  const pkgPath = join(workspaceDir, "package.json");
  let scripts = null;
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      if (pkg?.scripts && typeof pkg.scripts === "object") {
        scripts = pkg.scripts;
      }
    } catch {
      scripts = null;
    }
  }

  const pm = getPackageManager(workspaceDir);
  const runPrefix = pm === "pnpm" ? "pnpm run" : pm === "yarn" ? "yarn run" : "npm run";

  if (scripts && typeof scripts.dev === "string" && isSaneCommand(scripts.dev)) {
    return `${runPrefix} dev`;
  }
  if (scripts && typeof scripts.start === "string" && isSaneCommand(scripts.start)) {
    return `${runPrefix} start`;
  }

  if (existsSync(join(workspaceDir, "node_modules", "vite", "bin", "vite.js"))) {
    return "npx vite";
  }
  return null;
}

/** Run build in workspace. */
export async function runBuild(workspaceDir, config) {
  console.log("  [build] ", config.buildCommand);
  await runCommand(workspaceDir, config.buildCommand);
}

/**
 * Many dev servers (Vite, CRA, etc.) ignore process.env.PORT. Append --port so they listen on the assigned port.
 * For "npm run dev" / "npm run start" we pass -- --port <port> so the script receives it.
 */
function effectiveStartCommand(startCommand, port) {
  const cmd = (startCommand || "").trim();
  if (cmd.includes("--port")) return cmd;
  if (/^(npm|pnpm|yarn)\s+run\s+dev(\s|$)/.test(cmd)) {
    return `${cmd} -- --host 127.0.0.1 --port ${port}`;
  }
  if (/^(npm|pnpm|yarn)\s+run\s+start(\s|$)/.test(cmd)) {
    return `${cmd} -- --port ${port}`;
  }
  if (/^\s*npx\s+vite\s/.test(cmd)) {
    return `${cmd} --host 127.0.0.1 --port ${port}`;
  }
  return cmd;
}

/** Start app in workspace on given port. Returns child process. */
export function startApp(workspaceDir, port, config) {
  const {
    env: previewEnv,
    injectedKeys,
    placeholderMode,
    supabaseDetected,
  } = resolveStartEnv(workspaceDir, config);
  const env = { ...process.env, ...previewEnv, PORT: String(port) };
  const command = effectiveStartCommand(config.startCommand, port);
  const isWin = process.platform === "win32";
  const child = spawn(isWin ? "cmd" : "sh", [isWin ? "/c" : "-c", command], {
    cwd: workspaceDir,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.__visudevInjectedEnvKeys = injectedKeys;
  child.__visudevSupabasePlaceholderMode = placeholderMode;
  child.__visudevSupabaseDetected = supabaseDetected;
  child.stdout?.on("data", (d) => process.stdout.write(`[preview ${port}] ${d}`));
  child.stderr?.on("data", (d) => process.stderr.write(`[preview ${port}] ${d}`));
  child.on("error", (err) => console.error(`[preview ${port}] error:`, err));
  return child;
}
