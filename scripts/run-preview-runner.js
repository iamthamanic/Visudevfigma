#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
/**
 * Startet den Preview-Runner mit USE_REAL_BUILD=1 (echter Build).
 * Wenn Docker verfügbar ist, wird USE_DOCKER=1 gesetzt, damit Previews
 * im Container laufen und zuverlässig auf dem erwarteten Port erreichbar sind.
 */
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const runnerDir = path.join(projectRoot, "preview-runner");
const runnerPath = path.join(runnerDir, "index.js");

function isDockerAvailable() {
  const r = spawnSync("docker", ["info"], {
    stdio: "ignore",
    timeout: 5000,
  });
  return r.status === 0;
}

const env = { ...process.env, USE_REAL_BUILD: "1" };
const dockerOverrideRaw = process.env.USE_DOCKER;
const hasDockerOverride = typeof dockerOverrideRaw === "string";
const dockerOverride =
  hasDockerOverride && ["1", "true", "yes"].includes(dockerOverrideRaw.trim().toLowerCase());

if (hasDockerOverride) {
  if (dockerOverride) {
    env.USE_DOCKER = "1";
    console.log("[run-preview-runner] USE_DOCKER erzwungen (Container-Modus aktiv).");
  } else {
    delete env.USE_DOCKER;
    console.log("[run-preview-runner] USE_DOCKER deaktiviert (Host-Modus aktiv).");
  }
} else if (isDockerAvailable()) {
  env.USE_DOCKER = "1";
  console.log("[run-preview-runner] Docker erkannt – App-Flow-Previews laufen im Container.");
} else {
  console.log("[run-preview-runner] Docker nicht gefunden – Previews laufen direkt auf dem Host.");
}

const child = spawn(process.execPath, [runnerPath], {
  cwd: runnerDir,
  stdio: "inherit",
  env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
