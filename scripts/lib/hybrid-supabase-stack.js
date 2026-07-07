/**
 * Start supabase functions serve for hybrid dev (no check shim).
 * Location: scripts/lib/hybrid-supabase-stack.js
 */
const { spawnSupabase } = require("./supabase-cli-direct");

/**
 * @param {{ spawn?: typeof spawnSupabase, env?: NodeJS.ProcessEnv }} [deps]
 */
function startFunctionsServe(deps = {}) {
  const spawnFn = deps.spawn ?? spawnSupabase;
  const env = deps.env ?? process.env;
  return spawnFn(["functions", "serve"], { env, stdio: "inherit" });
}

module.exports = { startFunctionsServe };
