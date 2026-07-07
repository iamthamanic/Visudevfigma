/**
 * Start supabase functions serve for hybrid dev (no check shim).
 * Location: scripts/lib/hybrid-supabase-stack.js
 */
const { spawnSupabase } = require("./supabase-cli-direct");

/**
 * @param {{ spawnSupabase?: typeof spawnSupabase, env?: NodeJS.ProcessEnv }} [deps]
 */
function startFunctionsServe(deps = {}) {
  const spawnSupabaseFn = deps.spawnSupabase ?? spawnSupabase;
  const env = deps.env ?? process.env;
  return spawnSupabaseFn(["functions", "serve"], { env, stdio: "inherit" });
}

module.exports = { startFunctionsServe };
