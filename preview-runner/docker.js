/**
 * VisuDEV Preview Runner – Docker-basierter Build & Serve (fipso/runner-ähnlich)
 * Ein Container pro Preview: install → build → serve auf Port 3000 im Container.
 * Host-Port wird auf Container:3000 gemappt, kein "App ignoriert PORT"-Problem.
 */

import { spawn } from "node:child_process";
import { resolve } from "node:path";

const DOCKER_IMAGE = process.env.VISUDEV_DOCKER_IMAGE || "node:20-alpine";
const CONTAINER_PORT = 3000;

/** Container-Name aus runId (Docker: nur [a-zA-Z0-9][a-zA-Z0-9_.-]). */
function containerName(runId) {
  return (
    "visudev-preview-" +
    String(runId)
      .replace(/[^a-zA-Z0-9_.-]/g, "_")
      .slice(0, 50)
  );
}

/** Führt einen Befehl aus, gibt Promise mit stdout/stderr oder wirft. */
function exec(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: ["ignore", "pipe", "pipe"],
      ...opts,
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => (stdout += d.toString()));
    child.stderr?.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `Exit ${code}`));
    });
    child.on("error", reject);
  });
}

/**
 * Startet einen Docker-Container: Workspace gemountet, darin install → build → serve auf 3000.
 * Host appPort wird auf Container:3000 gemappt.
 * @param {string} workspaceDir - absoluter Pfad zum geklonten Repo
 * @param {number} appPort - Host-Port (wird auf Container 3000 gemappt)
 * @param {string} runId - z. B. run_123_abc (für Container-Namen)
 * @returns {Promise<string>} Container-ID
 */
export async function runContainer(workspaceDir, appPort, runId) {
  const name = containerName(runId);
  // Install → build → serve: Ausgabeordner automatisch wählen (dist | build | out | .)
  const cmd =
    "(npm ci --ignore-scripts 2>/dev/null || npm install --ignore-scripts) && npm run build && " +
    '(D=dist; [ -d build ] && D=build; [ -d out ] && D=out; [ ! -d "$D" ] && D=.; exec npx serve "$D" -s -l ' +
    CONTAINER_PORT +
    ")";
  const absPath = resolve(workspaceDir);
  const isWin = process.platform === "win32";
  const mount = isWin ? absPath.replace(/\\/g, "/") : absPath;
  const args = [
    "run",
    "-d",
    "--rm",
    "--name",
    name,
    "-p",
    `${appPort}:${CONTAINER_PORT}`,
    "-v",
    `${mount}:/app`,
    "-w",
    "/app",
    "-e",
    "NODE_ENV=production",
    DOCKER_IMAGE,
    "sh",
    "-c",
    cmd,
  ];
  await exec("docker", args).catch((e) => {
    console.error("  [docker] run failed:", e.message);
    throw e;
  });
  return name;
}

/**
 * Stoppt und entfernt den Container (--rm entfernt automatisch, stop reicht).
 * @param {string} runId - derselbe runId wie bei runContainer
 */
export async function stopContainer(runId) {
  const name = containerName(runId);
  try {
    await exec("docker", ["stop", "-t", "3", name]);
  } catch {
    // Container existiert nicht oder schon gestoppt
  }
}

/**
 * Prüft, ob Docker verfügbar ist.
 * @returns {Promise<boolean>}
 */
export async function isDockerAvailable() {
  try {
    await exec("docker", ["info"]);
    return true;
  } catch {
    return false;
  }
}
