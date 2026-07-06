/**
 * Docker availability check for hybrid dev.
 * Location: scripts/lib/hybrid-docker-check.js
 */

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * @param {{ spawnSync?: import('child_process').spawnSync }} [deps]
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
function checkDockerAvailable(deps = {}) {
  const { spawnSync } = require("child_process");
  const spawnSyncFn = deps.spawnSync ?? spawnSync;

  let docker;
  try {
    docker = spawnSyncFn("docker", ["info"], { stdio: "ignore", timeout: 8000 });
  } catch (error) {
    return { ok: false, message: `Docker-Prüfung fehlgeschlagen: ${errorMessage(error)}` };
  }

  if (docker.error) {
    if (docker.error.code === "ENOENT") {
      return {
        ok: false,
        message: "Docker CLI nicht gefunden. Bitte Docker Desktop installieren.",
      };
    }
    if (docker.error.code === "ETIMEDOUT") {
      return {
        ok: false,
        message:
          "Docker-Prüfung hat das Zeitlimit überschritten. Docker Desktop starten oder erneut versuchen.",
      };
    }
    return { ok: false, message: `Docker-Prüfung fehlgeschlagen: ${docker.error.message}` };
  }

  if (docker.status !== 0) {
    return {
      ok: false,
      message:
        "Docker nicht erreichbar. Bitte Docker Desktop starten (Supabase lokal braucht Docker).",
    };
  }

  return { ok: true };
}

module.exports = { checkDockerAvailable };
