/**
 * VisuDEV Preview Runner
 *
 * API: POST /start, GET /status/:runId, POST /stop/:runId, POST /refresh, POST /webhook/github
 * Real mode (USE_REAL_BUILD=1): clone repo, build, start app on assigned port.
 * Refresh: git pull + rebuild + restart so preview shows latest from repo (live).
 * GitHub Webhook: on push, auto-refresh matching preview (pull + rebuild + restart).
 */

import crypto from "node:crypto";
import http from "node:http";
import { getWorkspaceDir, cloneOrPull, getConfig, runBuild, startApp } from "./build.js";

const PORT = Number(process.env.PORT) || 4000;
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || "";
const PREVIEW_PORT_MIN = Number(process.env.PREVIEW_PORT_MIN) || 4001;
const PREVIEW_PORT_MAX = Number(process.env.PREVIEW_PORT_MAX) || 4099;
const PREVIEW_BASE_URL = process.env.PREVIEW_BASE_URL || "";
const SIMULATE_DELAY_MS = Number(process.env.SIMULATE_DELAY_MS) || 3000;
const USE_REAL_BUILD =
  process.env.USE_REAL_BUILD === "1" ||
  process.env.USE_REAL_BUILD === "true" ||
  process.env.USE_REAL_BUILD === "yes";

const runs = new Map();
const usedPorts = new Set();
/** port -> http.Server (placeholder/error page only) */
const portServers = new Map();

function getNextFreePort() {
  for (let p = PREVIEW_PORT_MIN; p <= PREVIEW_PORT_MAX; p++) {
    if (!usedPorts.has(p)) {
      usedPorts.add(p);
      return p;
    }
  }
  return null;
}

function releasePort(port) {
  const server = portServers.get(port);
  if (server) {
    server.close();
    portServers.delete(port);
  }
  usedPorts.delete(port);
}

/** Start a minimal HTTP server on the given port (stub or error page). */
function startPlaceholderServer(port, errorMessage = null) {
  const html = errorMessage
    ? `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preview Fehler</title></head><body style="font-family:sans-serif;padding:2rem;background:#1a1a2e;color:#eee;"><h1>Preview Fehler</h1><pre style="white-space:pre-wrap;color:#f88;">${escapeHtml(errorMessage)}</pre></body></html>`
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preview Stub</title></head><body style="font-family:sans-serif;padding:2rem;background:#1a1a2e;color:#eee;"><h1>Preview (Stub)</h1><p>Port ${port} – setze USE_REAL_BUILD=1 für echten Clone/Build/Start.</p></body></html>`;
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`  Placeholder listening on http://localhost:${port}`);
  });
  portServers.set(port, server);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Background: clone, build, start app. On failure set run.status = "failed" and show error placeholder. */
async function buildAndStartAsync(runId) {
  const run = runs.get(runId);
  if (!run || run.status !== "starting") return;
  const { repo, branchOrCommit, projectId, port, previewUrl } = run;
  const workspaceDir = getWorkspaceDir(projectId);

  try {
    await cloneOrPull(repo, branchOrCommit, workspaceDir);
    const config = getConfig(workspaceDir);
    await runBuild(workspaceDir, config);
    const child = startApp(workspaceDir, port, config);
    run.childProcess = child;
    run.status = "ready";
    run.readyAt = new Date().toISOString();
    run.error = null;
    child.on("exit", (code) => {
      if (run.childProcess === child) run.childProcess = null;
    });
    console.log(`  Preview ready: ${previewUrl}`);
  } catch (err) {
    const msg = err.message || String(err);
    run.status = "failed";
    run.error = msg;
    run.readyAt = null;
    console.error(`  Preview failed [${runId}]:`, msg);
    startPlaceholderServer(port, `Build/Start fehlgeschlagen:\n${msg}`);
  }
}

/** Refresh: pull, rebuild, restart app for same run (live update). */
async function refreshAsync(runId) {
  const run = runs.get(runId);
  if (!run || !run.port) return;
  const { repo, branchOrCommit, projectId, port } = run;
  const workspaceDir = getWorkspaceDir(projectId);

  if (run.childProcess) {
    run.childProcess.kill("SIGTERM");
    run.childProcess = null;
  }
  run.status = "starting";

  try {
    await cloneOrPull(repo, branchOrCommit, workspaceDir);
    const config = getConfig(workspaceDir);
    await runBuild(workspaceDir, config);
    const child = startApp(workspaceDir, port, config);
    run.childProcess = child;
    run.status = "ready";
    run.readyAt = new Date().toISOString();
    run.error = null;
    child.on("exit", (code) => {
      if (run.childProcess === child) run.childProcess = null;
    });
    console.log(`  Preview refreshed: http://localhost:${port}`);
  } catch (err) {
    const msg = err.message || String(err);
    run.status = "failed";
    run.error = msg;
    console.error(`  Refresh failed [${runId}]:`, msg);
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function send(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(data));
}

function corsPreflight(res) {
  res.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "600",
  });
  res.end();
}

async function handleStart(req, res, _url) {
  const body = await parseBody(req);
  const { repo, branchOrCommit = "main", projectId } = body;
  if (!repo || !projectId) {
    send(res, 400, {
      success: false,
      error: "repo and projectId are required",
    });
    return;
  }

  const assignedPort = getNextFreePort();
  if (assignedPort === null) {
    send(res, 503, {
      success: false,
      error: "No free port in pool (PREVIEW_PORT_MIN–PREVIEW_PORT_MAX)",
    });
    return;
  }

  const previewUrl =
    PREVIEW_BASE_URL.trim() !== ""
      ? `${PREVIEW_BASE_URL.replace(/\/$/, "")}?preview=${assignedPort}`
      : `http://localhost:${assignedPort}`;

  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  runs.set(runId, {
    status: "starting",
    port: assignedPort,
    previewUrl,
    error: null,
    startedAt: new Date().toISOString(),
    repo,
    branchOrCommit,
    projectId,
    childProcess: null,
  });

  if (USE_REAL_BUILD) {
    buildAndStartAsync(runId);
  } else {
    startPlaceholderServer(assignedPort);
    setTimeout(() => {
      const run = runs.get(runId);
      if (run && run.status === "starting") {
        run.status = "ready";
        run.readyAt = new Date().toISOString();
      }
    }, SIMULATE_DELAY_MS);
  }

  send(res, 200, {
    success: true,
    runId,
    status: "starting",
  });
}

function handleStatus(req, res, url) {
  const match = url.pathname.match(/^\/status\/([^/]+)$/);
  const runId = match ? match[1] : null;
  if (!runId) {
    send(res, 404, { success: false, error: "runId required" });
    return;
  }

  const run = runs.get(runId);
  if (!run) {
    send(res, 404, { success: false, error: "Run not found", status: "unknown" });
    return;
  }

  send(res, 200, {
    success: true,
    status: run.status,
    previewUrl: run.previewUrl ?? undefined,
    error: run.error ?? undefined,
    startedAt: run.startedAt,
    readyAt: run.readyAt,
  });
}

function handleStop(req, res, url) {
  const match = url.pathname.match(/^\/stop\/([^/]+)$/);
  const runId = match ? match[1] : null;
  if (!runId) {
    send(res, 404, { success: false, error: "runId required" });
    return;
  }

  const run = runs.get(runId);
  if (!run) {
    send(res, 404, { success: false, error: "Run not found" });
    return;
  }

  if (run.childProcess) {
    run.childProcess.kill("SIGTERM");
    run.childProcess = null;
  }
  if (run.port != null) {
    releasePort(run.port);
  }
  run.status = "stopped";
  run.stoppedAt = new Date().toISOString();
  send(res, 200, {
    success: true,
    runId,
    status: "stopped",
  });
}

function handleHealth(_req, res) {
  send(res, 200, { ok: true, service: "visudev-preview-runner" });
}

async function handleRefresh(req, res) {
  const body = await parseBody(req);
  const runId = body.runId;
  if (!runId) {
    send(res, 400, { success: false, error: "runId required" });
    return;
  }
  const run = runs.get(runId);
  if (!run) {
    send(res, 404, { success: false, error: "Run not found" });
    return;
  }
  refreshAsync(runId);
  send(res, 200, { success: true, status: "starting" });
}

/** GitHub Webhook: on push, find runs for repo+branch and auto-refresh (pull + rebuild + restart). */
function handleWebhookGitHub(req, res, rawBody) {
  const sig = req.headers["x-hub-signature-256"];
  if (GITHUB_WEBHOOK_SECRET && sig) {
    const hmac = crypto.createHmac("sha256", GITHUB_WEBHOOK_SECRET);
    hmac.update(rawBody);
    const expected = "sha256=" + hmac.digest("hex");
    if (
      expected.length !== sig.length ||
      !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
    ) {
      send(res, 401, { error: "Invalid signature" });
      return;
    }
  } else if (GITHUB_WEBHOOK_SECRET && !sig) {
    send(res, 401, { error: "Missing X-Hub-Signature-256" });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    send(res, 400, { error: "Invalid JSON" });
    return;
  }

  if (req.headers["x-github-event"] === "ping") {
    send(res, 200, { ok: true, message: "pong" });
    return;
  }

  if (req.headers["x-github-event"] !== "push") {
    send(res, 200, { ok: true, ignored: true });
    return;
  }

  if (payload.repository?.full_name == null) {
    send(res, 400, { error: "Missing repository.full_name" });
    return;
  }

  const repo = payload.repository.full_name;
  let branch = null;
  if (payload.ref && typeof payload.ref === "string" && payload.ref.startsWith("refs/heads/")) {
    branch = payload.ref.slice("refs/heads/".length);
  }

  const refreshed = [];
  for (const [runId, run] of runs) {
    if (run.repo !== repo || run.status !== "ready") continue;
    if (branch != null && run.branchOrCommit !== branch) continue;
    refreshAsync(runId);
    refreshed.push(runId);
  }

  if (refreshed.length > 0) {
    console.log(
      `  Webhook: push to ${repo} ${branch ?? "*"} → refreshed ${refreshed.length} preview(s)`,
    );
  }
  send(res, 200, { ok: true, refreshed: refreshed.length });
}

/** Read raw body from req (for webhook signature verification). */
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    corsPreflight(res);
    return;
  }

  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

  if (req.method === "POST" && url.pathname === "/webhook/github") {
    try {
      const rawBody = await readRawBody(req);
      handleWebhookGitHub(req, res, rawBody);
    } catch (e) {
      console.error(e);
      send(res, 500, { success: false, error: e instanceof Error ? e.message : "Internal error" });
    }
    return;
  }

  try {
    if (req.method === "GET" && url.pathname === "/health") {
      handleHealth(req, res);
      return;
    }
    if (req.method === "POST" && url.pathname === "/start") {
      await handleStart(req, res, url);
      return;
    }
    if (req.method === "GET" && url.pathname.startsWith("/status/")) {
      handleStatus(req, res, url);
      return;
    }
    if (req.method === "POST" && url.pathname.startsWith("/stop/")) {
      handleStop(req, res, url);
      return;
    }
    if (req.method === "POST" && url.pathname === "/refresh") {
      await handleRefresh(req, res);
      return;
    }
    send(res, 404, { error: "Not found" });
  } catch (e) {
    console.error(e);
    send(res, 500, {
      success: false,
      error: e instanceof Error ? e.message : "Internal error",
    });
  }
});

server.listen(PORT, () => {
  console.log(`Preview Runner listening on http://localhost:${PORT}`);
  console.log(`  Port pool: ${PREVIEW_PORT_MIN}-${PREVIEW_PORT_MAX} (auto-assigned per run)`);
  console.log(`  Mode: ${USE_REAL_BUILD ? "REAL (clone, build, start)" : "STUB (placeholder)"}`);
  if (PREVIEW_BASE_URL) {
    console.log(`  PREVIEW_BASE_URL=${PREVIEW_BASE_URL}`);
  }
  if (!USE_REAL_BUILD) {
    console.log(`  SIMULATE_DELAY_MS=${SIMULATE_DELAY_MS}`);
  }
  if (GITHUB_WEBHOOK_SECRET) {
    console.log(`  GitHub Webhook: POST /webhook/github (Signature verified)`);
  } else {
    console.log(`  GitHub Webhook: POST /webhook/github (set GITHUB_WEBHOOK_SECRET to verify)`);
  }
});
