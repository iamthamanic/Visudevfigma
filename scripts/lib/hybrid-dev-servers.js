/**
 * Hybrid dev server startup (functions serve + dev-auto in parallel).
 * Location: scripts/lib/hybrid-dev-servers.js
 */
const { spawn } = require("child_process");
const path = require("path");
const { startFunctionsServe } = require("./hybrid-supabase-stack");
const { defaultLocalSupabaseUrl, waitForSupabaseHealth } = require("./supabase-local");

const ROOT = path.join(__dirname, "../..");
const DEV_AUTO_SCRIPT = path.join(__dirname, "../dev-auto.js");

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * @param {Record<string, unknown>} [deps]
 */
function createHybridDevServerRunner(deps = {}) {
  const d = {
    startFunctionsServe,
    waitForSupabaseHealth,
    defaultLocalSupabaseUrl,
    spawn,
    rootDir: ROOT,
    devAutoScript: DEV_AUTO_SCRIPT,
    ...deps,
  };

  /**
   * @param {{
   *   env: NodeJS.ProcessEnv,
   *   registerChild: (child: import('child_process').ChildProcess) => import('child_process').ChildProcess,
   *   isShuttingDown: () => boolean,
   *   onHealthOk?: () => void,
   *   spawnFn?: typeof spawn,
   * }} options
   */
  function startHybridDevServers(options) {
    const spawnFn = options.spawnFn ?? d.spawn;
    const baseUrl = options.env.VITE_SUPABASE_URL || d.defaultLocalSupabaseUrl();

    const functionsServe = options.registerChild(d.startFunctionsServe({ env: options.env }));

    const devAuto = options.registerChild(
      spawnFn(process.execPath, [d.devAutoScript], {
        cwd: d.rootDir,
        env: { ...options.env, VISUDEV_FAST_DEV: "1" },
        stdio: "inherit",
      }),
    );

    void d.waitForSupabaseHealth(baseUrl, { maxAttempts: 120, intervalMs: 500 }).then((healthy) => {
      if (healthy) options.onHealthOk?.();
      else {
        console.warn(
          "[dev-hybrid] Edge Functions noch nicht bereit — Login/API kann kurz fehlschlagen.",
        );
      }
    });

    return new Promise((resolve) => {
      let settled = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      functionsServe.once("error", (err) => {
        finish({ ok: false, error: `functions serve spawn failed: ${errorMessage(err)}` });
      });

      devAuto.once("error", (err) => {
        finish({ ok: false, error: `dev-auto spawn failed: ${errorMessage(err)}` });
      });

      devAuto.on("exit", (code) => {
        finish({ ok: true, exitCode: code ?? 0 });
      });

      functionsServe.on("exit", (code) => {
        if (!options.isShuttingDown()) {
          finish({
            ok: false,
            error: `functions serve beendet (code ${code ?? "?"})`,
            exitCode: code ?? 1,
          });
        }
      });
    });
  }

  return { startHybridDevServers };
}

const { startHybridDevServers } = createHybridDevServerRunner();

module.exports = { createHybridDevServerRunner, startHybridDevServers };
