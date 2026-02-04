/**
 * VisuDEV Preview Runner – Clone, Build, Start
 * Real repo clone, build, and start app on assigned port.
 * Supports refresh (git pull + rebuild + restart) for live updates.
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const WORKSPACE_ROOT = join(__dirname, "workspace");

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
      shell: true,
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

/** Erkennt den Paketmanager anhand der Lock-Dateien (pnpm > yarn > npm). */
function getPackageManager(workspaceDir) {
  if (existsSync(join(workspaceDir, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(workspaceDir, "yarn.lock"))) return "yarn";
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
  return new Promise((resolve, reject) => {
    const child = spawn("git", list, {
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
}

/** Prüft, ob origin/branch neue Commits hat (nach fetch). Gibt true zurück, wenn Pull nötig. */
export async function hasNewCommits(workspaceDir, branch) {
  if (!workspaceDir || !existsSync(workspaceDir)) return false;
  const branchSafe =
    (branch || "main").replace(/[^a-zA-Z0-9/_.-]/g, "").replace(/^-+/, "") || "main";
  try {
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
export function getConfig(workspaceDir) {
  const configPath = join(workspaceDir, "visudev.config.json");
  let buildCommand = DEFAULT_BUILD;
  let startCommand = DEFAULT_START;
  let port = 3000;
  if (existsSync(configPath)) {
    try {
      const raw = readFileSync(configPath, "utf8");
      const config = JSON.parse(raw);
      buildCommand = isSaneCommand(config.buildCommand) ? config.buildCommand : DEFAULT_BUILD;
      startCommand = isSaneCommand(config.startCommand) ? config.startCommand : DEFAULT_START;
      if (Number(config.port) === config.port) port = config.port;
    } catch (e) {
      // use defaults
    }
  }
  buildCommand = ensureIgnoreScripts(buildCommand);
  return {
    buildCommand,
    startCommand,
    port,
  };
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
  if (/^(npm|pnpm|yarn)\s+run\s+(dev|start)(\s|$)/.test(cmd) || /^\s*npx\s+vite\s/.test(cmd)) {
    return `${cmd} -- --port ${port}`;
  }
  return cmd;
}

/** Start app in workspace on given port. Returns child process. */
export function startApp(workspaceDir, port, config) {
  const env = { ...process.env, PORT: String(port) };
  const command = effectiveStartCommand(config.startCommand, port);
  const isWin = process.platform === "win32";
  const child = spawn(isWin ? "cmd" : "sh", [isWin ? "/c" : "-c", command], {
    cwd: workspaceDir,
    shell: true,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (d) => process.stdout.write(`[preview ${port}] ${d}`));
  child.stderr?.on("data", (d) => process.stderr.write(`[preview ${port}] ${d}`));
  child.on("error", (err) => console.error(`[preview ${port}] error:`, err));
  return child;
}
