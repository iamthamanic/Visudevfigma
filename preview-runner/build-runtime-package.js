import { join } from "node:path";
import { warnNonFatal } from "./build-logging.js";
import { getBuildRuntimeDeps } from "./build-runtime-deps.js";
import { isCommandAvailable } from "./build-runtime-process.js";

export function isSaneCommand(cmd) {
  if (typeof cmd !== "string" || !cmd.trim()) return false;
  const c = cmd.trim();
  if (c === "npm" || c === "npm -h" || c === "npm --help") return false;
  if (/^npm\s+(-[a-zA-Z]|--[a-z-]+)\s*$/i.test(c)) return false;
  return true;
}

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

export function getPackageManager(workspaceDir) {
  const runtimeDeps = getBuildRuntimeDeps();
  if (runtimeDeps.existsSync(join(workspaceDir, "pnpm-lock.yaml")) && isCommandAvailable("pnpm")) {
    return "pnpm";
  }
  if (runtimeDeps.existsSync(join(workspaceDir, "yarn.lock")) && isCommandAvailable("yarn")) {
    return "yarn";
  }
  return "npm";
}

export function ensurePackageJsonScripts(workspaceDir) {
  const runtimeDeps = getBuildRuntimeDeps();
  const pkgPath = join(workspaceDir, "package.json");
  if (!runtimeDeps.existsSync(pkgPath)) return;
  let pkg;
  try {
    pkg = JSON.parse(runtimeDeps.readFileSync(pkgPath, "utf8"));
  } catch (error) {
    warnNonFatal(`ensurePackageJsonScripts: invalid package.json (${pkgPath})`, error);
    return;
  }

  const scripts = pkg.scripts;
  if (!scripts || typeof scripts !== "object") return;
  for (const [name, value] of Object.entries(scripts)) {
    if (isBadScriptValue(value)) {
      warnNonFatal(`ensurePackageJsonScripts: unsafe script "${name}" in ${pkgPath}`);
    }
  }
}

export function getBuildScript(workspaceDir) {
  const runtimeDeps = getBuildRuntimeDeps();
  const pkgPath = join(workspaceDir, "package.json");
  if (!runtimeDeps.existsSync(pkgPath)) return null;
  try {
    const pkg = JSON.parse(runtimeDeps.readFileSync(pkgPath, "utf8"));
    const script = pkg?.scripts?.build;
    if (isBadScriptValue(script)) return null;
    return script.trim();
  } catch (error) {
    warnNonFatal(`getBuildScript: invalid package.json (${pkgPath})`, error);
    return null;
  }
}
