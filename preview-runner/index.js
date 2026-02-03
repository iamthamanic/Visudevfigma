/**
 * VisuDEV Preview Runner
 *
 * API: POST /start, GET /status/:runId, POST /stop/:runId
 * MVP: In-memory stub; assigns a free port per run and returns previewUrl (http://localhost:PORT).
 * Optional PREVIEW_BASE_URL for tunnel/public URL. Replace with real clone/build/run for production.
 */

import http from "node:http";

const PORT = Number(process.env.PORT) || 4000;
const PREVIEW_PORT_MIN = Number(process.env.PREVIEW_PORT_MIN) || 4001;
const PREVIEW_PORT_MAX = Number(process.env.PREVIEW_PORT_MAX) || 4099;
const PREVIEW_BASE_URL = process.env.PREVIEW_BASE_URL || "";
const SIMULATE_DELAY_MS = Number(process.env.SIMULATE_DELAY_MS) || 3000;

const runs = new Map();
const usedPorts = new Set();

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
  usedPorts.delete(port);
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
  });

  setTimeout(() => {
    const run = runs.get(runId);
    if (run && run.status === "starting") {
      run.status = "ready";
      run.readyAt = new Date().toISOString();
    }
  }, SIMULATE_DELAY_MS);

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

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    corsPreflight(res);
    return;
  }

  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

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
  if (PREVIEW_BASE_URL) {
    console.log(`  PREVIEW_BASE_URL=${PREVIEW_BASE_URL}`);
  }
  console.log(`  SIMULATE_DELAY_MS=${SIMULATE_DELAY_MS}`);
});
