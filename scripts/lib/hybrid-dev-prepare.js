/**
 * Hybrid dev env preparation (Docker + Supabase status/start).
 * Location: scripts/lib/hybrid-dev-prepare.js
 */
const { checkDockerAvailable } = require("./hybrid-docker-check");
const {
  createSupabaseStatusClient,
  hasStoppedSupabaseServices,
  extractStoppedServices,
} = require("./hybrid-supabase-status");
const { localSupabaseEnvFromStatus } = require("./hybrid-supabase-env");
const { withLocalDemoAuthEnv } = require("./local-demo-user");

function isLocalStackReady(status) {
  if (!status || typeof status !== "object") return false;
  const anonKey =
    (typeof status.ANON_KEY === "string" && status.ANON_KEY.trim()) ||
    (typeof status.anon_key === "string" && status.anon_key.trim()) ||
    "";
  return anonKey.length > 0;
}

/**
 * @param {Record<string, unknown>} [deps]
 */
function createHybridDevPreparer(deps = {}) {
  const d = {
    checkDockerAvailable,
    createSupabaseStatusClient,
    localSupabaseEnvFromStatus,
    ...deps,
  };

  /**
   * @param {{ statusClient?: ReturnType<typeof createSupabaseStatusClient>, dockerDeps?: object }} [innerDeps]
   */
  function prepareHybridDevEnv(innerDeps = {}) {
    const statusClient = innerDeps.statusClient ?? d.createSupabaseStatusClient();

    const docker = d.checkDockerAvailable(innerDeps.dockerDeps);
    if (!docker.ok) return { ok: false, error: docker.message };

    let result = statusClient.readSupabaseStatus();
    let startedStack = false;

    if (!result.ok || !isLocalStackReady(result.status)) {
      startedStack = true;
      const start = statusClient.startSupabaseStack();
      if (!start.ok) {
        return {
          ok: false,
          error: start.error ?? result.error ?? "supabase start fehlgeschlagen",
          exitCode: start.exitCode,
        };
      }
      result = statusClient.readSupabaseStatus();
      if (!result.ok || !isLocalStackReady(result.status)) {
        return {
          ok: false,
          error: result.ok
            ? "supabase status lieferte keinen Anon-Key (Stack nicht bereit?)"
            : result.error,
        };
      }
    }

    const statusText = statusClient.readSupabaseStatusText();
    if (statusText.ok && hasStoppedSupabaseServices(statusText.text)) {
      const stopped = extractStoppedServices(statusText.text);
      console.warn(
        `[dev-hybrid] Gestoppte Supabase-Services erkannt (${stopped.join(", ")}) — Neustart …`,
      );
      startedStack = true;
      const restart = statusClient.restartSupabaseStack();
      if (!restart.ok) {
        return {
          ok: false,
          error: restart.error ?? "supabase restart fehlgeschlagen",
          exitCode: restart.exitCode,
        };
      }
      result = statusClient.readSupabaseStatus();
      if (!result.ok || !isLocalStackReady(result.status)) {
        return {
          ok: false,
          error: result.ok ? "supabase status nach Neustart ohne Anon-Key" : result.error,
        };
      }
    }

    const envResult = d.localSupabaseEnvFromStatus(result.status);
    if (!envResult.ok) return { ok: false, error: envResult.error };

    return {
      ok: true,
      env: withLocalDemoAuthEnv(envResult.env),
      status: result.status,
      startedStack,
    };
  }

  return { prepareHybridDevEnv };
}

const { prepareHybridDevEnv } = createHybridDevPreparer();

module.exports = { createHybridDevPreparer, prepareHybridDevEnv };
