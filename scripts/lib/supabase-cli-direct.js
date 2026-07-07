/**
 * Invoke the real Supabase CLI for local dev (bypasses supabase-checked.sh / AI review).
 * Location: scripts/lib/supabase-cli-direct.js
 */
const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../..");
const WORKDIR_ARGS = ["--workdir", "src"];

function readRealSupabaseBin() {
  if (process.env.SUPABASE_REAL_BIN?.trim()) {
    return process.env.SUPABASE_REAL_BIN.trim();
  }
  const homeFile = path.join(process.env.HOME || "", ".supabase-real-bin");
  try {
    if (fs.existsSync(homeFile)) {
      const bin = fs.readFileSync(homeFile, "utf8").trim();
      if (bin) return bin;
    }
  } catch {
    /* ignore */
  }
  return "";
}

/**
 * @param {string[]} args
 */
function resolveSupabaseInvocation(args) {
  const realBin = readRealSupabaseBin();
  if (realBin && fs.existsSync(realBin)) {
    return { cmd: realBin, args: [...WORKDIR_ARGS, ...args] };
  }
  // Registry package — avoid project shim in node_modules/.bin/supabase
  return { cmd: "npx", args: ["--yes", "-p", "supabase", "supabase", ...WORKDIR_ARGS, ...args] };
}

/**
 * @param {string[]} args
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv, stdio?: import('child_process').StdioOptions }} [options]
 */
function runSupabaseSync(args, options = {}) {
  const { cmd, args: cliArgs } = resolveSupabaseInvocation(args);
  return spawnSync(cmd, cliArgs, {
    cwd: options.cwd ?? ROOT,
    encoding: "utf8",
    env: options.env ?? process.env,
    stdio: options.stdio ?? "pipe",
  });
}

/**
 * @param {string[]} args
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv, stdio?: import('child_process').StdioOptions }} [options]
 */
function spawnSupabase(args, options = {}) {
  const { cmd, args: cliArgs } = resolveSupabaseInvocation(args);
  return spawn(cmd, cliArgs, {
    cwd: options.cwd ?? ROOT,
    env: options.env ?? process.env,
    stdio: options.stdio ?? "inherit",
    ...options,
  });
}

module.exports = { runSupabaseSync, spawnSupabase, resolveSupabaseInvocation };
