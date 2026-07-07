/**
 * Map Supabase status JSON to local Vite + Edge Function env vars.
 * Location: scripts/lib/hybrid-supabase-env.js
 */
const { defaultLocalSupabaseUrl } = require("./supabase-local");
const { validateEnvValue } = require("./env-value-validator");

/**
 * Host-reachable API URL for functions serve (Deno on host cannot resolve docker "kong").
 * @param {Record<string, unknown>} status
 */
function resolveLocalApiUrl(status) {
  const fromStatus =
    (typeof status.API_URL === "string" && status.API_URL.trim()) ||
    (typeof status.api_url === "string" && status.api_url.trim()) ||
    "";
  if (fromStatus && validateEnvValue("VITE_SUPABASE_URL", fromStatus)) {
    return fromStatus;
  }
  return defaultLocalSupabaseUrl();
}

/**
 * @param {Record<string, unknown>} status
 * @returns {{
 *   ok: true,
 *   env: {
 *     VITE_SUPABASE_URL: string,
 *     VITE_SUPABASE_ANON_KEY: string,
 *   },
 * } | { ok: false, error: string }}
 */
function localSupabaseEnvFromStatus(status) {
  const apiUrl = resolveLocalApiUrl(status);
  const anonKey =
    (typeof status.ANON_KEY === "string" && status.ANON_KEY.trim()) ||
    (typeof status.anon_key === "string" && status.anon_key.trim()) ||
    (typeof status.PUBLISHABLE_KEY === "string" && status.PUBLISHABLE_KEY.trim()) ||
    "";
  if (!validateEnvValue("VITE_SUPABASE_URL", apiUrl)) {
    return { ok: false, error: "API_URL aus supabase status ist ungültig" };
  }
  if (!validateEnvValue("VITE_SUPABASE_ANON_KEY", anonKey)) {
    return { ok: false, error: "Anon-Key aus supabase status fehlt oder ist ungültig" };
  }

  return {
    ok: true,
    env: {
      VITE_SUPABASE_URL: apiUrl,
      VITE_SUPABASE_ANON_KEY: anonKey,
    },
  };
}

module.exports = { localSupabaseEnvFromStatus, resolveLocalApiUrl };
