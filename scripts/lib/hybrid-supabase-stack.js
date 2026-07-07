/**
 * Start supabase functions serve for hybrid dev.
 * Location: scripts/lib/hybrid-supabase-stack.js
 */
const { spawn } = require("child_process");
const path = require("path");

const ROOT = path.join(__dirname, "../..");
const SUPABASE_SHIM = path.join(__dirname, "../supabase-checked.sh");

/**
 * @param {{ spawn?: typeof spawn, env?: NodeJS.ProcessEnv }} [deps]
 */
function startFunctionsServe(deps = {}) {
  const spawnFn = deps.spawn ?? spawn;
  const env = deps.env ?? process.env;
  return spawnFn(
    "bash",
    [SUPABASE_SHIM, "--no-ai-review", "--workdir", "src", "functions", "serve"],
    {
      cwd: ROOT,
      env,
      stdio: "inherit",
    },
  );
}

module.exports = { startFunctionsServe };
