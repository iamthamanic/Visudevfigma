/**
 * Local Supabase status/start helpers (no process exit, no env mutation).
 * Location: scripts/lib/hybrid-supabase-status.js
 */
const { spawnSync } = require("child_process");
const path = require("path");

const ROOT = path.join(__dirname, "../..");
const SUPABASE_SHIM = path.join(__dirname, "../supabase-checked.sh");

function redactSecrets(text) {
  return text.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[REDACTED]");
}

/**
 * @param {{ spawnSync?: typeof spawnSync }} [deps]
 */
function createSupabaseStatusClient(deps = {}) {
  const spawnSyncFn = deps.spawnSync ?? spawnSync;

  function runSupabase(args, inherit = false) {
    return spawnSyncFn("bash", [SUPABASE_SHIM, "--no-ai-review", "--workdir", "src", ...args], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: inherit ? "inherit" : "pipe",
    });
  }

  function readSupabaseStatus() {
    const result = runSupabase(["status", "-o", "json"]);
    if (result.status !== 0) {
      const stderr = result.stderr?.trim() || "unknown error";
      return { ok: false, error: `supabase status failed (exit ${result.status}): ${stderr}` };
    }
    if (!result.stdout?.trim()) {
      return { ok: false, error: "supabase status returned empty output" };
    }
    try {
      return { ok: true, status: JSON.parse(result.stdout) };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { ok: false, error: `supabase status JSON parse failed: ${msg}` };
    }
  }

  function startSupabaseStack() {
    const start = runSupabase(["start"], false);
    if (start.status !== 0) {
      const stderr = start.stderr?.trim();
      const safeDetail = stderr ? redactSecrets(stderr).slice(0, 240) : "unknown error";
      return {
        ok: false,
        error: `supabase start fehlgeschlagen: ${safeDetail}`,
        exitCode: start.status ?? 1,
      };
    }
    return { ok: true };
  }

  return { readSupabaseStatus, startSupabaseStack };
}

module.exports = { createSupabaseStatusClient };
