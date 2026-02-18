import { warnNonFatal } from "./build-logging.js";
import { getBuildRuntimeDeps } from "./build-runtime-deps.js";
import { redactRuntimeOutput } from "./build-runtime-redact.js";

const MAX_CAPTURED_OUTPUT_CHARS = 262_144;

function appendCapturedOutput(current, chunk) {
  const merged = current + chunk;
  if (merged.length <= MAX_CAPTURED_OUTPUT_CHARS) {
    return { text: merged, truncated: false };
  }
  return {
    text: merged.slice(merged.length - MAX_CAPTURED_OUTPUT_CHARS),
    truncated: true,
  };
}

function finalizeOutput(text, mergedEnv, truncated) {
  const redacted = redactRuntimeOutput(text, mergedEnv);
  if (!truncated) return redacted;
  return `[output truncated to last ${MAX_CAPTURED_OUTPUT_CHARS} chars]\n${redacted}`;
}

export function runCommand(cwd, command, env = {}) {
  const runtimeDeps = getBuildRuntimeDeps();
  const mergedEnv = { ...runtimeDeps.env(), ...env };
  return new Promise((resolve, reject) => {
    const isWin = runtimeDeps.platform() === "win32";
    const child = runtimeDeps.spawn(isWin ? "cmd" : "sh", [isWin ? "/c" : "-c", command], {
      cwd,
      env: mergedEnv,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    let stdout = "";
    let stdoutTruncated = false;
    let stderrTruncated = false;
    child.stdout?.on("data", (d) => {
      const next = appendCapturedOutput(stdout, d.toString());
      stdout = next.text;
      stdoutTruncated = stdoutTruncated || next.truncated;
    });
    child.stderr?.on("data", (d) => {
      const next = appendCapturedOutput(stderr, d.toString());
      stderr = next.text;
      stderrTruncated = stderrTruncated || next.truncated;
    });
    child.on("close", (code) => {
      const stdoutSafe = finalizeOutput(stdout, mergedEnv, stdoutTruncated);
      const stderrSafe = finalizeOutput(stderr, mergedEnv, stderrTruncated);
      if (code === 0) resolve({ stdout: stdoutSafe, stderr: stderrSafe });
      else reject(new Error(stderrSafe || stdoutSafe || `Exit ${code}`));
    });
    child.on("error", reject);
  });
}

export function runPackageManager(cwd, cmd, args, env = {}) {
  const runtimeDeps = getBuildRuntimeDeps();
  const list = Array.isArray(args) ? args.filter((a) => a != null && a !== "") : [];
  const mergedEnv = { ...runtimeDeps.env(), ...env };
  return new Promise((resolve, reject) => {
    const child = runtimeDeps.spawn(cmd, list, {
      cwd,
      env: mergedEnv,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    let stdout = "";
    let stdoutTruncated = false;
    let stderrTruncated = false;
    child.stdout?.on("data", (d) => {
      const next = appendCapturedOutput(stdout, d.toString());
      stdout = next.text;
      stdoutTruncated = stdoutTruncated || next.truncated;
    });
    child.stderr?.on("data", (d) => {
      const next = appendCapturedOutput(stderr, d.toString());
      stderr = next.text;
      stderrTruncated = stderrTruncated || next.truncated;
    });
    child.on("close", (code) => {
      const stdoutSafe = finalizeOutput(stdout, mergedEnv, stdoutTruncated);
      const stderrSafe = finalizeOutput(stderr, mergedEnv, stderrTruncated);
      if (code === 0) resolve({ stdout: stdoutSafe, stderr: stderrSafe });
      else reject(new Error(stderrSafe || stdoutSafe || `${cmd} exit ${code}`));
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
