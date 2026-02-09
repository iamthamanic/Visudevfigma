#!/usr/bin/env node
/* eslint-disable no-console */
const net = require("net");
const path = require("path");
const http = require("http");
const { spawn, spawnSync } = require("child_process");

const host = process.env.VITE_HOST || "127.0.0.1";
const MIN_PORT = 1;
const MAX_PORT = 65535;

/** Parse env port with validation; fallback on NaN or out-of-range, log warning. */
function parsePort(envValue, defaultPort, name) {
  const raw = envValue ?? String(defaultPort);
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < MIN_PORT || n > MAX_PORT) {
    console.warn(
      `[dev-auto] Ungültiger Port ${name}=${raw} (erwartet ${MIN_PORT}-${MAX_PORT}), nutze ${defaultPort}.`,
    );
    return defaultPort;
  }
  return n;
}

const requestedVitePort = parsePort(process.env.VITE_PORT, 3005, "VITE_PORT");
const requestedRunnerPort = parsePort(process.env.PREVIEW_RUNNER_PORT, 4000, "PREVIEW_RUNNER_PORT");

function tryListen(port, hostToCheck) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => resolve(false));
    const opts = hostToCheck ? { port, host: hostToCheck } : { port };
    server.listen(opts, () => {
      server.close(() => resolve(true));
    });
  });
}

async function isPortFree(port) {
  // Check both IPv6/any and IPv4 loopback to avoid false-free on macOS dual-stack.
  const freeAny = await tryListen(port, undefined);
  if (!freeAny) return false;
  const freeV4 = await tryListen(port, "127.0.0.1");
  return freeV4;
}

async function findFreePort(startPort) {
  const portStart =
    Number.isFinite(startPort) && startPort >= MIN_PORT && startPort <= MAX_PORT ? startPort : 3005;
  let port = portStart;
  for (let i = 0; i < 50; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const free = await isPortFree(port);
    if (free) return port;
    port += 1;
  }
  throw new Error(`No free port found starting at ${portStart}`);
}

/** Gleiche Port-Kandidaten wie der Runner (preview-runner/index.js RUNNER_PORT_CANDIDATES). */
const RUNNER_PORT_CANDIDATES = [requestedRunnerPort, 4100, 4110, 4120, 4130].filter(
  (p, i, a) => a.indexOf(p) === i,
);

/** Prüft, ob auf einem der Kandidaten-Ports bereits ein Runner /health antwortet (z. B. npx visudev-runner). */
function findExistingRunner() {
  return new Promise((resolve) => {
    let i = 0;
    function tryNext() {
      if (i >= RUNNER_PORT_CANDIDATES.length) {
        resolve(null);
        return;
      }
      const port = RUNNER_PORT_CANDIDATES[i++];
      const url = `http://${host}:${port}`;
      const opts = { hostname: host, port, path: "/health", method: "GET" };
      const req = http.request(opts, (res) => {
        res.resume();
        if (res.statusCode === 200) resolve(url);
        else tryNext();
      });
      req.on("error", () => tryNext());
      req.setTimeout(2000, () => {
        req.destroy();
        tryNext();
      });
      req.end();
    }
    tryNext();
  });
}

/** Wartet, bis der Preview Runner auf /health antwortet (dann ist er bereit und Vite bekommt die richtige URL). */
function waitForRunner(url, maxAttempts = 30, intervalMs = 500) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = { hostname: u.hostname, port: u.port, path: "/health", method: "GET" };
    let attempts = 0;
    const tryOnce = () => {
      attempts += 1;
      const req = http.request(opts, (res) => {
        res.resume();
        if (res.statusCode === 200) {
          resolve();
          return;
        }
        if (attempts >= maxAttempts) {
          reject(
            new Error(
              `Runner ${url} nicht bereit nach ${maxAttempts} Versuchen (Status ${res.statusCode})`,
            ),
          );
          return;
        }
        setTimeout(tryOnce, intervalMs);
      });
      req.on("error", () => {
        if (attempts >= maxAttempts) {
          reject(
            new Error(
              `Runner ${url} nicht erreichbar nach ${maxAttempts} Versuchen. Läuft der Runner?`,
            ),
          );
          return;
        }
        setTimeout(tryOnce, intervalMs);
      });
      req.setTimeout(intervalMs, () => {
        req.destroy();
        if (attempts >= maxAttempts) reject(new Error(`Runner ${url} Timeout`));
        else setTimeout(tryOnce, intervalMs);
      });
      req.end();
    };
    tryOnce();
  });
}

async function main() {
  const vitePort = await findFreePort(requestedVitePort);

  // Wenn schon ein Runner läuft (z. B. npx visudev-runner), diesen nutzen – sonst eigenen starten
  let previewUrl = await findExistingRunner();
  let runner = null;

  if (previewUrl) {
    console.log(
      `[dev-auto] Vorhandenen Runner gefunden: ${previewUrl} (kein zweiter wird gestartet)`,
    );
  } else {
    const runnerPort = await findFreePort(requestedRunnerPort);
    previewUrl = `http://${host}:${runnerPort}`;
    const envForRunner = {
      ...process.env,
      VITE_PREVIEW_RUNNER_URL: previewUrl,
      PORT: String(runnerPort),
      USE_REAL_BUILD: "1",
    };
    if (spawnSync("docker", ["info"], { stdio: "ignore", timeout: 5000 }).status === 0) {
      envForRunner.USE_DOCKER = "1";
    }
    console.log(
      `[dev-auto] Runner: ${previewUrl} (npx visudev-runner)${runnerPort !== requestedRunnerPort ? ` — port ${requestedRunnerPort} war belegt` : ""}`,
    );
    runner = spawn("npx", ["visudev-runner"], {
      env: envForRunner,
      stdio: "inherit",
      shell: true,
    });
    await waitForRunner(previewUrl).catch((err) => {
      console.error("[dev-auto] Runner nicht bereit:", err.message);
      runner.kill("SIGTERM");
      process.exit(1);
    });
    console.log("[dev-auto] Runner bereit, starte Vite …");
  }

  const envForVite = {
    ...process.env,
    VITE_PREVIEW_RUNNER_URL: previewUrl,
  };
  console.log(`[dev-auto] Vite: http://${host}:${vitePort}`);
  console.log(`[dev-auto] VITE_PREVIEW_RUNNER_URL=${previewUrl}`);

  const vite = spawn(
    "npx",
    ["vite", "--host", host, "--port", String(vitePort), "--strictPort", "--open"],
    {
      env: envForVite,
      stdio: "inherit",
      shell: true,
    },
  );

  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    if (runner && !runner.killed) runner.kill(signal);
    if (!vite.killed) vite.kill(signal);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  if (runner) {
    runner.on("exit", (code) => {
      if (!shuttingDown) {
        console.error(`[dev-auto] Runner exited (code ${code ?? "unknown"}). Stopping Vite.`);
        shutdown("SIGTERM");
        process.exit(code ?? 1);
      }
    });
  }

  vite.on("exit", (code) => {
    if (!shuttingDown) {
      console.error(`[dev-auto] Vite exited (code ${code ?? "unknown"}). Stopping Runner.`);
      shutdown("SIGTERM");
      process.exit(code ?? 1);
    }
  });
}

main().catch((err) => {
  console.error("[dev-auto] Failed to start dev environment", err);
  process.exit(1);
});
