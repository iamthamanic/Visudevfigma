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
import {
  getWorkspaceDir,
  cloneOrPull,
  checkoutCommit,
  getConfig,
  runBuild,
  runBuildNodeDirect,
  startApp,
  hasNewCommits,
  ensurePackageJsonScripts,
} from "./build.js";
import { runContainer, stopContainer, isDockerAvailable } from "./docker.js";

const PORT = Number(process.env.PORT) || 4000;
const AUTO_REFRESH_INTERVAL_MS = Number(process.env.AUTO_REFRESH_INTERVAL_MS) || 60_000;
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || "";
const PREVIEW_PORT_MIN = Number(process.env.PREVIEW_PORT_MIN) || 4001;
const PREVIEW_PORT_MAX = Number(process.env.PREVIEW_PORT_MAX) || 4099;
const PREVIEW_BASE_URL = process.env.PREVIEW_BASE_URL || "";
const PREVIEW_PUBLIC_ORIGIN = process.env.PREVIEW_PUBLIC_ORIGIN || "";
const PREVIEW_BIND_HOST = process.env.PREVIEW_BIND_HOST || "127.0.0.1";
const SIMULATE_DELAY_MS = Number(process.env.SIMULATE_DELAY_MS) || 3000;
const USE_REAL_BUILD =
  process.env.USE_REAL_BUILD === "1" ||
  process.env.USE_REAL_BUILD === "true" ||
  process.env.USE_REAL_BUILD === "yes";
const USE_DOCKER =
  process.env.USE_DOCKER === "1" ||
  process.env.USE_DOCKER === "true" ||
  process.env.USE_DOCKER === "yes";

const runs = new Map();
const usedPorts = new Set();
/** port -> http.Server (placeholder/error page only) */
const portServers = new Map();
/** projectId -> promise chain to serialize git/build per repo */
const workspaceLocks = new Map();

function getNextFreePort() {
  for (let p = PREVIEW_PORT_MIN; p <= PREVIEW_PORT_MAX; p++) {
    if (!usedPorts.has(p)) {
      usedPorts.add(p);
      return p;
    }
  }
  return null;
}

/** Reserve two consecutive ports: [proxyPort, appPort]. Proxy is the one returned as previewUrl; app runs on appPort. */
function getTwoFreePorts() {
  for (let p = PREVIEW_PORT_MIN; p <= PREVIEW_PORT_MAX - 1; p++) {
    if (!usedPorts.has(p) && !usedPorts.has(p + 1)) {
      usedPorts.add(p);
      usedPorts.add(p + 1);
      return [p, p + 1];
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

/** CSP value so VisuDEV can embed the preview in iframes (any origin; restrict in production if needed). */
const FRAME_ANCESTORS = "frame-ancestors *";

function resolvePreviewUrl(proxyPort) {
  if (PREVIEW_PUBLIC_ORIGIN) {
    const origin = PREVIEW_PUBLIC_ORIGIN.replace(/\/$/, "");
    return `${origin}:${proxyPort}`;
  }
  if (PREVIEW_BASE_URL.trim() !== "") {
    return `${PREVIEW_BASE_URL.replace(/\/$/, "")}/${proxyPort}`;
  }
  return `http://localhost:${proxyPort}`;
}

function stripRunnerPrefix(pathname) {
  if (pathname === "/runner") return "/";
  if (pathname.startsWith("/runner/")) return pathname.slice("/runner".length) || "/";
  return pathname;
}

function buildProxyErrorPage(title, hint) {
  return (
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>` +
    `<body style="font-family:sans-serif;padding:1.5rem;background:#1a1a2e;color:#e2e8f0;max-width:28rem;">` +
    `<h2 style="color:#f87171;">${escapeHtml(title)}</h2>` +
    `<p style="color:#94a3b8;">${escapeHtml(hint)}</p>` +
    `<p style="font-size:0.875rem;">Port/App prüfen oder Preview in VisuDEV neu starten.</p>` +
    `<script>try{window.addEventListener("load",function(){window.parent.postMessage({type:"visudev-preview-error",reason:"Preview-App nicht erreichbar (502). Bitte Preview neu starten."},"*");});}catch(e){}</script>` +
    `</body></html>`
  );
}

function proxyPreviewRequest(req, res, targetPort, targetPath) {
  const opts = {
    hostname: "127.0.0.1",
    port: targetPort,
    path: targetPath,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${targetPort}` },
  };
  const proxy = http.request(opts, (upstreamRes) => {
    const headers = { ...upstreamRes.headers };
    delete headers["x-frame-options"];
    delete headers["content-security-policy"];
    headers["content-security-policy"] = FRAME_ANCESTORS;
    res.writeHead(upstreamRes.statusCode || 502, headers);
    upstreamRes.pipe(res, { end: true });
  });
  proxy.on("error", (err) => {
    const isRefused = /ECONNREFUSED|connect/i.test(err.message);
    const title = isRefused ? "Preview-App nicht erreichbar" : "Proxy-Fehler";
    const hint = isRefused
      ? "Die gebaute App antwortet nicht auf dem erwarteten Port. Bitte „Preview neu starten“ in VisuDEV oder npm run dev + Docker prüfen."
      : err.message;
    res.writeHead(502, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": FRAME_ANCESTORS,
    });
    res.end(buildProxyErrorPage(title, hint));
  });
  req.pipe(proxy, { end: true });
}

/** Wait until app on port responds with 2xx. Rejects when maxMs elapsed without success (so we don't mark "ready" when app never started). */
function waitForAppReady(port, maxMs = 60_000) {
  const interval = 500;
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + maxMs;
    const tryOnce = () => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path: "/",
          method: "GET",
          timeout: 5000,
        },
        (res) => {
          res.resume();
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve();
            return;
          }
          if (Date.now() >= deadline) {
            reject(
              new Error(
                `Preview-App antwortet nicht auf Port ${port} innerhalb von ${maxMs / 1000}s (Status ${res.statusCode}).`,
              ),
            );
            return;
          }
          setTimeout(tryOnce, interval);
        },
      );
      req.on("error", (err) => {
        if (Date.now() >= deadline) {
          reject(
            new Error(
              `Preview-App nicht erreichbar (Port ${port}). ECONNREFUSED nach ${maxMs / 1000}s – Build/Container prüfen.`,
            ),
          );
          return;
        }
        setTimeout(tryOnce, interval);
      });
      req.on("timeout", () => {
        req.destroy();
        if (Date.now() >= deadline) {
          reject(
            new Error(
              `Preview-App antwortet nicht auf Port ${port} innerhalb von ${maxMs / 1000}s (Timeout).`,
            ),
          );
          return;
        }
        setTimeout(tryOnce, interval);
      });
      req.end();
    };
    tryOnce();
  });
}

/** Create HTTP proxy on proxyPort that forwards to appPort and adds frame-ancestors so iframes work. */
function createFrameProxy(proxyPort, appPort) {
  const server = http.createServer((clientReq, clientRes) => {
    const opts = {
      hostname: "127.0.0.1",
      port: appPort,
      path: clientReq.url,
      method: clientReq.method,
      headers: { ...clientReq.headers, host: `127.0.0.1:${appPort}` },
    };
    const proxy = http.request(opts, (upstreamRes) => {
      const headers = { ...upstreamRes.headers };
      delete headers["x-frame-options"];
      delete headers["content-security-policy"];
      headers["content-security-policy"] = FRAME_ANCESTORS;
      clientRes.writeHead(upstreamRes.statusCode, headers);
      upstreamRes.pipe(clientRes, { end: true });
    });
    proxy.on("error", (err) => {
      const isRefused = /ECONNREFUSED|connect/i.test(err.message);
      const title = isRefused ? "Preview-App nicht erreichbar" : "Proxy-Fehler";
      const hint = isRefused
        ? "Die gebaute App antwortet nicht auf dem erwarteten Port. Bitte „Preview neu starten“ in VisuDEV oder npm run dev + Docker prüfen."
        : escapeHtml(err.message);
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body style="font-family:sans-serif;padding:1.5rem;background:#1a1a2e;color:#e2e8f0;max-width:28rem;"><h2 style="color:#f87171;">${escapeHtml(title)}</h2><p style="color:#94a3b8;">${hint}</p><p style="font-size:0.875rem;">Port/App prüfen oder Preview in VisuDEV neu starten.</p><script>try{window.addEventListener("load",function(){window.parent.postMessage({type:"visudev-preview-error",reason:"Preview-App nicht erreichbar (502). Bitte Preview neu starten."},"*");});}catch(e){}</script></body></html>`;
      clientRes.writeHead(502, {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": FRAME_ANCESTORS,
      });
      clientRes.end(html);
    });
    clientReq.pipe(proxy, { end: true });
  });
  server.listen(proxyPort, PREVIEW_BIND_HOST, () => {
    console.log(
      `  Frame proxy http://${PREVIEW_BIND_HOST}:${proxyPort} -> http://127.0.0.1:${appPort}`,
    );
  });
  return server;
}

/** Start a minimal HTTP server on the given port (stub or error page). Sends CSP so iframe embedding works. */
function startPlaceholderServer(port, errorMessage = null) {
  const html = errorMessage
    ? `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preview Fehler</title></head><body style="font-family:sans-serif;padding:2rem;background:#1a1a2e;color:#eee;"><h1>Preview Fehler</h1><pre style="white-space:pre-wrap;color:#f88;">${escapeHtml(errorMessage)}</pre></body></html>`
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preview Stub</title></head><body style="font-family:sans-serif;padding:2rem;background:#1a1a2e;color:#eee;max-width:36rem;"><h1>Preview (Stub)</h1><p>Port ${port} – hier würde die gebaute App laufen.</p><p>Der Runner startet aktuell <strong>keine</strong> echte App. Für echte Previews:</p><ol style="margin:0.5rem 0;padding-left:1.5rem;"><li>Runner stoppen (Ctrl+C)</li><li>Starten mit echtem Build:<br><code style="background:#333;padding:0.25rem 0.5rem;border-radius:4px;">USE_REAL_BUILD=1 npm start</code></li><li>Optional: <code style="background:#333;padding:0.1rem 0.3rem;">GITHUB_TOKEN</code> setzen (für private Repos)</li></ol><p style="color:#9ca3af;font-size:0.9rem;">Siehe <code>docs/PREVIEW_RUNNER.md</code>.</p></body></html>`;
  const server = http.createServer((req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": FRAME_ANCESTORS,
    });
    res.end(html);
  });
  server.listen(port, PREVIEW_BIND_HOST, () => {
    console.log(`  Placeholder listening on http://${PREVIEW_BIND_HOST}:${port}`);
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

/** Prüft, ob die Fehlermeldung wie npm/git-Hilfe aussieht (für Retry mit --ignore-scripts). */
function isNpmOrGitHelpError(msg) {
  const t = String(msg || "");
  if (
    t.includes("Verwendung: git") ||
    t.includes("Usage: git") ||
    (t.includes("git [-v | --version]") && t.includes("<command>"))
  )
    return true;
  if (
    t.includes("npm <command>") ||
    (t.includes("Usage:") && t.includes("npm install") && t.includes("npm run")) ||
    (t.includes("Specify configs") && t.includes("npm help config"))
  )
    return true;
  return false;
}

/** If error is Git/npm help output, return a short actionable message instead. */
function normalizeBuildError(msg) {
  const t = String(msg || "");
  if (
    t.includes("Verwendung: git") ||
    t.includes("Usage: git") ||
    (t.includes("git [-v | --version]") && t.includes("<command>"))
  ) {
    return (
      "Build/Start fehlgeschlagen: Im Build oder in einer Abhängigkeit wird vermutlich 'git' ohne Unterbefehl aufgerufen (z. B. in einem postinstall-Skript). " +
      "Bitte package.json-Skripte und Abhängigkeiten prüfen. Ursprüngliche Ausgabe wurde gekürzt."
    );
  }
  if (
    t.includes("npm <command>") ||
    (t.includes("Usage:") && t.includes("npm install") && t.includes("npm run")) ||
    (t.includes("Specify configs") && t.includes("npm help config"))
  ) {
    return (
      "Build/Start fehlgeschlagen: Es wird 'npm' ohne Unterbefehl aufgerufen (z. B. in einem Skript oder einer Abhängigkeit). " +
      "Bitte package.json-Skripte (build, postinstall, start, …) und Abhängigkeiten prüfen – dort darf nicht nur „npm“ oder „npm -h“ stehen. Ursprüngliche Ausgabe wurde gekürzt."
    );
  }
  return msg;
}

/** Append a step message to run.logs (for UI). */
function pushLog(run, message) {
  if (!run.logs) run.logs = [];
  run.logs.push({ time: new Date().toISOString(), message });
}

async function withWorkspaceLock(projectId, fn) {
  const key = String(projectId || "default");
  const prev = workspaceLocks.get(key) || Promise.resolve();
  let release = null;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  const chain = prev.then(() => current).catch(() => current);
  workspaceLocks.set(key, chain);
  await prev;
  try {
    return await fn();
  } finally {
    if (release) release();
    if (workspaceLocks.get(key) === chain) {
      workspaceLocks.delete(key);
    }
  }
}

/** Background: clone, build, start app on appPort, then start frame proxy on proxyPort. On failure show error placeholder on proxyPort. */
async function buildAndStartAsync(runId) {
  const run = runs.get(runId);
  if (!run || run.status !== "starting") return;
  run.logs = [];
  const { repo, branchOrCommit, projectId, proxyPort, appPort, previewUrl } = run;
  const workspaceDir = getWorkspaceDir(projectId);

  const setFailed = (displayMsg, hint = "") => {
    run.status = "failed";
    run.error = displayMsg;
    run.readyAt = null;
    run.containerId = null;
    releasePort(appPort);
    startPlaceholderServer(proxyPort, `Build/Start fehlgeschlagen:\n${displayMsg}${hint}`);
  };

  return withWorkspaceLock(projectId, async () => {
    try {
      await cloneOrPull(repo, branchOrCommit, workspaceDir);
      if (run.commitSha) {
        await checkoutCommit(workspaceDir, run.commitSha, branchOrCommit);
      }

      if (USE_DOCKER) {
        const dockerOk = await isDockerAvailable();
        if (!dockerOk) {
          setFailed(
            "Docker ist nicht verfügbar. USE_DOCKER=1 erfordert laufenden Docker (docker info).",
          );
          return;
        }
        ensurePackageJsonScripts(workspaceDir);
        const containerName = await runContainer(workspaceDir, appPort, runId);
        run.containerId = containerName;
        const proxyServer = createFrameProxy(proxyPort, appPort);
        run.proxyServer = proxyServer;
        portServers.set(proxyPort, proxyServer);
        await waitForAppReady(appPort, 120_000);
        run.status = "ready";
        run.readyAt = new Date().toISOString();
        run.error = null;
        console.log(`  Preview ready (Docker): ${previewUrl}`);
        return;
      }

      ensurePackageJsonScripts(workspaceDir);
      const config = getConfig(workspaceDir);
      let buildErr = null;
      try {
        await runBuildNodeDirect(workspaceDir);
      } catch (e) {
        buildErr = e;
        if (isNpmOrGitHelpError(e.message)) {
          try {
            await runBuild(workspaceDir, config);
            buildErr = null;
          } catch (retryErr) {
            buildErr = retryErr;
          }
        }
      }
      if (buildErr) throw buildErr;
      const child = startApp(workspaceDir, appPort, config);
      run.childProcess = child;
      const proxyServer = createFrameProxy(proxyPort, appPort);
      run.proxyServer = proxyServer;
      portServers.set(proxyPort, proxyServer);
      await waitForAppReady(appPort, 60_000);
      run.status = "ready";
      run.readyAt = new Date().toISOString();
      run.error = null;
      child.on("exit", (code, signal) => {
        if (run.childProcess === child) {
          run.childProcess = null;
          if (run.status === "ready") {
            run.status = "failed";
            run.error = `Preview-App beendet (exit ${code ?? "?"}${signal ? `, Signal ${signal}` : ""}). Bitte „Preview neu starten“.`;
            console.log(`  Preview app exited [${runId}]: code=${code} signal=${signal}`);
          }
        }
      });
      console.log(`  Preview ready: ${previewUrl}`);
    } catch (err) {
      if (USE_DOCKER && run.containerId) {
        try {
          await stopContainer(runId);
        } catch (_e) {}
      }
      const msg = err.message || String(err);
      const displayMsg = normalizeBuildError(msg);
      pushLog(run, "Fehlgeschlagen: " + displayMsg.slice(0, 200));
      setFailed(
        displayMsg,
        "\n\nWichtig: Dev-Server neu starten (npm run dev mit Ctrl+C beenden, dann erneut starten). Oder USE_DOCKER=1 versuchen (Docker muss laufen).",
      );
      console.error(`  Preview failed [${runId}]:`, msg);
    }
  });
}

/** Refresh: pull, rebuild, restart app on appPort (proxy stays). */
async function refreshAsync(runId) {
  const run = runs.get(runId);
  if (!run || !run.port) return;
  const { repo, branchOrCommit, projectId, proxyPort, appPort } = run;
  const workspaceDir = getWorkspaceDir(projectId);

  if (run.containerId) {
    try {
      await stopContainer(runId);
    } catch (_e) {}
    run.containerId = null;
  }
  if (run.childProcess) {
    run.childProcess.kill("SIGTERM");
    run.childProcess = null;
  }
  run.status = "starting";
  run.logs = [];

  return withWorkspaceLock(projectId, async () => {
    try {
      pushLog(run, "Git: Pull …");
      await cloneOrPull(repo, branchOrCommit, workspaceDir);
      pushLog(run, "Git: Pull fertig");

      if (USE_DOCKER) {
        const dockerOk = await isDockerAvailable();
        if (!dockerOk) {
          run.status = "failed";
          run.error = "Docker nicht verfügbar (Refresh).";
          pushLog(run, "Fehlgeschlagen: Docker nicht verfügbar");
          return;
        }
        pushLog(run, "Docker: Starte Container …");
        ensurePackageJsonScripts(workspaceDir);
        const containerName = await runContainer(workspaceDir, appPort, runId);
        run.containerId = containerName;
        pushLog(run, "Warte auf App …");
        await waitForAppReady(appPort, 120_000);
        pushLog(run, "Bereit");
        run.status = "ready";
        run.readyAt = new Date().toISOString();
        run.error = null;
        console.log(`  Preview refreshed (Docker): http://localhost:${proxyPort}`);
        return;
      }

      pushLog(run, "Build: npm install / build …");
      ensurePackageJsonScripts(workspaceDir);
      const config = getConfig(workspaceDir);
      let buildErr = null;
      try {
        await runBuildNodeDirect(workspaceDir);
      } catch (e) {
        buildErr = e;
        if (isNpmOrGitHelpError(e.message)) {
          try {
            await runBuild(workspaceDir, config);
            buildErr = null;
          } catch (retryErr) {
            buildErr = retryErr;
          }
        }
      }
      if (buildErr) throw buildErr;
      pushLog(run, "Build fertig");
      pushLog(run, "Start: App wird gestartet …");
      const child = startApp(workspaceDir, appPort, config);
      run.childProcess = child;
      pushLog(run, "Warte auf App …");
      await waitForAppReady(appPort, 60_000);
      pushLog(run, "Bereit");
      run.status = "ready";
      run.readyAt = new Date().toISOString();
      run.error = null;
      child.on("exit", (code, signal) => {
        if (run.childProcess === child) {
          run.childProcess = null;
          if (run.status === "ready") {
            run.status = "failed";
            run.error = `Preview-App beendet (exit ${code ?? "?"}${signal ? `, Signal ${signal}` : ""}). Bitte „Preview neu starten“.`;
            console.log(`  Preview app exited [${runId}]: code=${code} signal=${signal}`);
          }
        }
      });
      console.log(`  Preview refreshed: http://localhost:${proxyPort}`);
    } catch (err) {
      const msg = err.message || String(err);
      run.status = "failed";
      run.error = normalizeBuildError(msg);
      console.error(`  Refresh failed [${runId}]:`, msg);
    }
  });
}

/** Auto-Refresh: alle N Sekunden prüfen, ob Repo neue Commits hat; bei Bedarf pull + rebuild + restart. */
let autoRefreshTimer = null;
function startAutoRefresh() {
  if (autoRefreshTimer != null || (!USE_REAL_BUILD && !USE_DOCKER) || AUTO_REFRESH_INTERVAL_MS <= 0)
    return;
  autoRefreshTimer = setInterval(async () => {
    for (const [runId, run] of runs) {
      if (run.status !== "ready" || !run.port) continue;
      try {
        const workspaceDir = getWorkspaceDir(run.projectId);
        if (await hasNewCommits(workspaceDir, run.branchOrCommit)) {
          console.log(`  Auto-Refresh [${runId}]: neue Commits, starte Refresh …`);
          await refreshAsync(runId);
        }
      } catch (_e) {
        // Einzelner Lauf fehlgeschlagen, weiter mit nächstem
      }
    }
  }, AUTO_REFRESH_INTERVAL_MS);
  console.log(`  Auto-Refresh: alle ${AUTO_REFRESH_INTERVAL_MS / 1000}s auf neue Commits prüfen`);
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
  const { repo, branchOrCommit = "main", projectId, commitSha } = body;
  if (!repo || !projectId) {
    send(res, 400, {
      success: false,
      error: "repo and projectId are required",
    });
    return;
  }

  let proxyPort, appPort;
  if (USE_REAL_BUILD || USE_DOCKER) {
    const ports = getTwoFreePorts();
    if (ports === null) {
      send(res, 503, {
        success: false,
        error: "No free port pair in pool (PREVIEW_PORT_MIN–PREVIEW_PORT_MAX)",
      });
      return;
    }
    [proxyPort, appPort] = ports;
  } else {
    const single = getNextFreePort();
    if (single === null) {
      send(res, 503, {
        success: false,
        error: "No free port in pool (PREVIEW_PORT_MIN–PREVIEW_PORT_MAX)",
      });
      return;
    }
    proxyPort = single;
    appPort = single;
  }

  const previewUrl = resolvePreviewUrl(proxyPort);

  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const commitShaTrimmed =
    commitSha && /^[a-f0-9]{40}$/i.test(String(commitSha).trim()) ? String(commitSha).trim() : null;
  runs.set(runId, {
    status: "starting",
    port: proxyPort,
    proxyPort,
    appPort,
    previewUrl,
    error: null,
    startedAt: new Date().toISOString(),
    repo,
    branchOrCommit,
    projectId,
    commitSha: commitShaTrimmed,
    childProcess: null,
    proxyServer: null,
    logs: [],
  });

  if (USE_REAL_BUILD || USE_DOCKER) {
    buildAndStartAsync(runId);
  } else {
    startPlaceholderServer(proxyPort);
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
  const runId = match ? decodeURIComponent(match[1]) : null;
  if (!runId) {
    send(res, 404, { success: false, error: "runId required" });
    return;
  }

  const run = runs.get(runId);
  if (!run) {
    // Run not found (e.g. runner restarted): return 200 idle so frontend gets no 404 and can clear runId
    send(res, 200, { success: true, status: "idle" });
    return;
  }

  send(res, 200, {
    success: true,
    status: run.status,
    previewUrl: run.previewUrl ?? undefined,
    error: run.error ?? undefined,
    startedAt: run.startedAt,
    readyAt: run.readyAt,
    logs: run.logs || [],
  });
}

async function handleStop(req, res, url) {
  const match = url.pathname.match(/^\/stop\/([^/]+)$/);
  const runId = match ? decodeURIComponent(match[1]) : null;
  if (!runId) {
    send(res, 404, { success: false, error: "runId required" });
    return;
  }

  const run = runs.get(runId);
  if (!run) {
    send(res, 404, { success: false, error: "Run not found" });
    return;
  }

  if (run.containerId) {
    try {
      await stopContainer(runId);
    } catch (_e) {}
    run.containerId = null;
  }
  if (run.childProcess) {
    run.childProcess.kill("SIGTERM");
    run.childProcess = null;
  }
  if (run.port != null) {
    releasePort(run.port);
  }
  if (run.appPort != null && run.appPort !== run.port) {
    releasePort(run.appPort);
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
  send(res, 200, { ok: true, service: "visudev" });
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
  const strippedPath = stripRunnerPrefix(url.pathname);
  url.pathname = strippedPath;
  const pathname = url.pathname;

  const previewMatch = pathname.match(/^\/p\/(\d+)(\/.*)?$/);
  if (previewMatch) {
    const port = Number(previewMatch[1]);
    const rest = previewMatch[2] || "/";
    if (Number.isNaN(port) || port < PREVIEW_PORT_MIN || port > PREVIEW_PORT_MAX) {
      send(res, 400, { error: "Invalid preview port" });
      return;
    }
    proxyPreviewRequest(req, res, port, rest);
    return;
  }

  if (req.method === "POST" && pathname === "/webhook/github") {
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
    if (req.method === "GET" && pathname === "/health") {
      handleHealth(req, res);
      return;
    }
    if (req.method === "POST" && pathname === "/start") {
      await handleStart(req, res, url);
      return;
    }
    if (req.method === "GET" && pathname.startsWith("/status/")) {
      handleStatus(req, res, url);
      return;
    }
    if (req.method === "POST" && pathname.startsWith("/stop/")) {
      await handleStop(req, res, url);
      return;
    }
    if (req.method === "POST" && pathname === "/refresh") {
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
  console.log(
    `  Mode: ${USE_DOCKER ? "DOCKER (clone, build, serve in container)" : USE_REAL_BUILD ? "REAL (clone, build, start)" : "STUB (placeholder)"}`,
  );
  if (PREVIEW_BASE_URL) {
    console.log(`  PREVIEW_BASE_URL=${PREVIEW_BASE_URL}`);
  }
  if (PREVIEW_PUBLIC_ORIGIN) {
    console.log(`  PREVIEW_PUBLIC_ORIGIN=${PREVIEW_PUBLIC_ORIGIN}`);
  }
  if (PREVIEW_BIND_HOST) {
    console.log(`  PREVIEW_BIND_HOST=${PREVIEW_BIND_HOST}`);
  }
  if (!USE_REAL_BUILD && !USE_DOCKER) {
    console.log(`  SIMULATE_DELAY_MS=${SIMULATE_DELAY_MS}`);
  }
  if (GITHUB_WEBHOOK_SECRET) {
    console.log(`  GitHub Webhook: POST /webhook/github (Signature verified)`);
  } else {
    console.log(`  GitHub Webhook: POST /webhook/github (set GITHUB_WEBHOOK_SECRET to verify)`);
  }
  startAutoRefresh();
});
