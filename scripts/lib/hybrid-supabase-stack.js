/**
 * Start supabase functions serve for hybrid dev (no check shim).
 * Location: scripts/lib/hybrid-supabase-stack.js
 */
const { spawnSupabase } = require("./supabase-cli-direct");

/** Keys that break Docker edge workers when inherited from the host (.env.local). */
const FUNCTIONS_SERVE_STRIP_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_URL",
  "SUPABASE_INTERNAL_HOST_PORT",
];

/**
 * @param {NodeJS.ProcessEnv} [baseEnv]
 */
function envForFunctionsServe(baseEnv = process.env) {
  const env = { ...baseEnv };
  for (const key of FUNCTIONS_SERVE_STRIP_KEYS) {
    delete env[key];
  }
  return env;
}

/**
 * @param {{ spawnSupabase?: typeof spawnSupabase, env?: NodeJS.ProcessEnv }} [deps]
 */
function startFunctionsServe(deps = {}) {
  const spawnSupabaseFn = deps.spawnSupabase ?? spawnSupabase;
  const env = envForFunctionsServe(deps.env ?? process.env);
  return spawnSupabaseFn(["functions", "serve"], { env, stdio: "inherit" });
}

module.exports = { startFunctionsServe, envForFunctionsServe };
