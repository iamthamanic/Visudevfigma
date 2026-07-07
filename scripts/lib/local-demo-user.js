/**
 * Lokaler Demo-User für Hybrid-Dev (nur Docker-Supabase, nicht Cloud).
 * Location: scripts/lib/local-demo-user.js
 */

/** @readonly */
const LOCAL_DEMO_AUTH_EMAIL = "demo@visudev.local";

/** @readonly */
const LOCAL_DEMO_AUTH_PASSWORD = "visudev-demo";

/**
 * @param {Record<string, unknown>} status
 */
function serviceRoleKeyFromStatus(status) {
  const jwt = (typeof status.SERVICE_ROLE_KEY === "string" && status.SERVICE_ROLE_KEY.trim()) || "";
  if (jwt) return jwt;
  return (typeof status.SECRET_KEY === "string" && status.SECRET_KEY.trim()) || "";
}

/**
 * @param {NodeJS.ProcessEnv} env
 */
function withLocalDemoAuthEnv(env) {
  const out = { ...env };
  if (!out.VITE_DEMO_AUTH_EMAIL) out.VITE_DEMO_AUTH_EMAIL = LOCAL_DEMO_AUTH_EMAIL;
  if (!out.VITE_DEMO_AUTH_PASSWORD) out.VITE_DEMO_AUTH_PASSWORD = LOCAL_DEMO_AUTH_PASSWORD;
  return out;
}

module.exports = {
  LOCAL_DEMO_AUTH_EMAIL,
  LOCAL_DEMO_AUTH_PASSWORD,
  serviceRoleKeyFromStatus,
  withLocalDemoAuthEnv,
};
