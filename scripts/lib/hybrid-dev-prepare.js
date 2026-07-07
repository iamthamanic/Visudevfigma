/**
 * Hybrid dev env preparation (Docker + Supabase status/start).
 * Location: scripts/lib/hybrid-dev-prepare.js
 */
const { checkDockerAvailable } = require("./hybrid-docker-check");
const { createSupabaseStatusClient } = require("./hybrid-supabase-status");
const { localSupabaseEnvFromStatus } = require("./hybrid-supabase-env");
const { withLocalDemoAuthEnv } = require("./local-demo-user");

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

    if (!result.ok || !result.status?.API_URL) {
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
      if (!result.ok || !result.status?.API_URL) {
        return {
          ok: false,
          error: result.ok ? "supabase status lieferte keine API_URL" : result.error,
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
