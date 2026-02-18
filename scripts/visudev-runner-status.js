#!/usr/bin/env node
/* eslint-disable no-console */
const http = require("http");

const RUNNER_PORT_CANDIDATES = [4000, 4100, 4110, 4120, 4130, 4140];
const RUNNER_HOSTS = ["127.0.0.1", "localhost"];
const REQUEST_TIMEOUT_MS = 1500;

function requestJson(baseUrl, pathname) {
  return new Promise((resolve) => {
    const url = new URL(pathname, baseUrl);
    const req = http.request(
      {
        method: "GET",
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += String(chunk);
        });
        res.on("end", () => {
          let data;
          try {
            data = body ? JSON.parse(body) : undefined;
          } catch {
            data = undefined;
          }
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data,
          });
        });
      },
    );
    req.on("error", () => resolve({ ok: false, status: 0 }));
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy();
      resolve({ ok: false, status: 0 });
    });
    req.end();
  });
}

function formatUptime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "n/a";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

async function findRunner() {
  const envBase = (process.env.VISUDEV_RUNNER_URL || "").trim();
  const candidates = [];
  if (envBase) candidates.push(envBase.replace(/\/$/, ""));
  for (const host of RUNNER_HOSTS) {
    for (const port of RUNNER_PORT_CANDIDATES) {
      const base = `http://${host}:${port}`;
      if (!candidates.includes(base)) candidates.push(base);
    }
  }

  for (const base of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const health = await requestJson(base, "/health");
    if (!health.ok || !health.data || health.data.ok !== true) continue;
    return {
      base,
      health: health.data,
    };
  }
  return null;
}

function printInactive() {
  console.log("VisuDEV Runner: INACTIVE");
  console.log("Kein lokaler Runner gefunden (Ports 4000, 4100, 4110, 4120, 4130, 4140).");
  console.log("");
  console.log("Start:");
  console.log("  npm run visudev");
  console.log("  npm run visudev:runner");
  console.log("  npm run visudev-runner");
}

function printStatus(base, health, runsPayload) {
  console.log(`VisuDEV Runner: ACTIVE (${base})`);
  console.log(`Uptime: ${formatUptime(health.uptimeSec)}`);
  if (typeof health.activeRuns === "number") {
    console.log(`Active runs: ${health.activeRuns}`);
  }
  if (!runsPayload || !Array.isArray(runsPayload.runs)) {
    console.log("Run details: /runs endpoint nicht verfugbar.");
    return;
  }

  const runs = runsPayload.runs;
  const projects = Array.from(
    new Set(
      runs
        .map((run) => String(run.projectId || "").trim())
        .filter((projectId) => projectId.length > 0),
    ),
  );
  console.log(`Projects: ${projects.length > 0 ? projects.join(", ") : "-"}`);
  if (runs.length === 0) {
    console.log("Runs: none");
    return;
  }

  console.log("Runs:");
  for (const run of runs) {
    const runId = String(run.runId || "-");
    const projectId = String(run.projectId || "-");
    const status = String(run.status || "unknown");
    const repo = String(run.repo || "-");
    console.log(`  - ${runId} [${status}] project=${projectId} repo=${repo}`);
  }
}

async function main() {
  const runner = await findRunner();
  if (!runner) {
    printInactive();
    process.exit(0);
  }

  const runs = await requestJson(runner.base, "/runs");
  const runsPayload = runs.ok ? runs.data : undefined;
  printStatus(runner.base, runner.health, runsPayload);
}

main().catch((error) => {
  console.error(
    "Fehler beim Runner-Status:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
