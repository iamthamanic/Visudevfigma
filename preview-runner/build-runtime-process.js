import { warnNonFatal } from "./build-logging.js";
import { getBuildRuntimeDeps } from "./build-runtime-deps.js";

export function runCommand(cwd, command, env = {}) {
  const runtimeDeps = getBuildRuntimeDeps();
  return new Promise((resolve, reject) => {
    const isWin = runtimeDeps.platform() === "win32";
    const child = runtimeDeps.spawn(isWin ? "cmd" : "sh", [isWin ? "/c" : "-c", command], {
      cwd,
      env: { ...runtimeDeps.env(), ...env },
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

export function runPackageManager(cwd, cmd, args, env = {}) {
  const runtimeDeps = getBuildRuntimeDeps();
  const list = Array.isArray(args) ? args.filter((a) => a != null && a !== "") : [];
  return new Promise((resolve, reject) => {
    const child = runtimeDeps.spawn(cmd, list, {
      cwd,
      env: { ...runtimeDeps.env(), ...env },
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

function assertArgs(name, args) {
  const validArgs = Array.isArray(args) ? args.filter((a) => a != null && a !== "") : [];
  if (validArgs.length === 0) {
    throw new Error(`${name}: args must be a non-empty array`);
  }
}

export function runNpm(cwd, args, env = {}) {
  assertArgs("runNpm", args);
  return runPackageManager(cwd, "npm", args, env);
}

export function runPnpm(cwd, args, env = {}) {
  assertArgs("runPnpm", args);
  return runPackageManager(cwd, "pnpm", args, env);
}

export function runYarn(cwd, args, env = {}) {
  assertArgs("runYarn", args);
  return runPackageManager(cwd, "yarn", args, env);
}

export function isCommandAvailable(cmd) {
  const runtimeDeps = getBuildRuntimeDeps();
  try {
    const result = runtimeDeps.spawnSync(cmd, ["--version"], {
      stdio: "ignore",
      timeout: 1500,
      windowsHide: true,
    });
    return result.status === 0;
  } catch (error) {
    warnNonFatal(`isCommandAvailable failed (${cmd})`, error);
    return false;
  }
}
