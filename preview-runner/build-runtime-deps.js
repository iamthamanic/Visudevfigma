import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolveStartEnv } from "./build-env.js";

const runtimeDeps = Object.freeze({
  spawn,
  spawnSync,
  existsSync,
  readFileSync,
  resolveStartEnv,
  platform: () => process.platform,
  env: () => process.env,
  log: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
  stdoutWrite: (text) => process.stdout.write(text),
  stderrWrite: (text) => process.stderr.write(text),
});

export function getBuildRuntimeDeps() {
  return runtimeDeps;
}
