import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeRelativeDir } from "./build-candidates.js";
import { sanitizePreviewEnv } from "./build-env.js";
import { warnNonFatal } from "./build-logging.js";
import { getPackageManager, isSaneCommand } from "./build-runtime.js";

const DEFAULT_BUILD = "npm ci --ignore-scripts && npm run build";
const DEFAULT_START = "npx serve dist";

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
    } catch (error) {
      warnNonFatal(`getConfig: invalid JSON in ${configPath}`, error);
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
    } catch (error) {
      warnNonFatal(`resolveBestEffortStartCommand: invalid package.json in ${workspaceDir}`, error);
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
