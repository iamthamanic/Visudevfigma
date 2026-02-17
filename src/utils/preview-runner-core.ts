import {
  getEffectiveRunnerUrl,
  setDiscoveredRunnerUrl,
  shouldDiscoverRunner,
} from "./preview-runner-mode";
import {
  parseRunnerHealthPayload,
  parseRunnerJsonText,
  parseRunnerRuntimeSnapshot,
  warnRunner,
  type RunnerHealthPayload,
} from "./preview-runner-parser";
import type { PreviewRunnerRuntimeStatus } from "./preview-runner-types";
import { getPreviewRunnerClientDeps } from "./preview-runner-deps";

const RUNNER_PORT_CANDIDATES = [4000, 4100, 4110, 4120, 4130, 4140];
const RUNNER_REQUEST_TIMEOUT_MS = 1500;

async function requestRunnerJson(
  baseUrl: string,
  pathname: string,
): Promise<{ ok: boolean; status: number; data?: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RUNNER_REQUEST_TIMEOUT_MS);
  try {
    const deps = getPreviewRunnerClientDeps();
    const response = await deps.fetch(`${baseUrl.replace(/\/$/, "")}${pathname}`, {
      method: "GET",
      signal: controller.signal,
    });
    const text = await response.text();
    const data = parseRunnerJsonText(text, `Runner ${pathname} response`);
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    warnRunner(`Runner request failed (${pathname})`, error);
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

async function checkRunnerHealth(baseUrl: string): Promise<RunnerHealthPayload | null> {
  const out = await requestRunnerJson(baseUrl, "/health");
  if (!out.ok || !out.data) return null;
  return parseRunnerHealthPayload(out.data);
}

export async function discoverRunnerUrl(): Promise<string | null> {
  const hosts = ["localhost", "127.0.0.1"];
  for (const port of RUNNER_PORT_CANDIDATES) {
    for (const host of hosts) {
      const url = `http://${host}:${port}`;
      if (await checkRunnerHealth(url)) {
        setDiscoveredRunnerUrl(url);
        return url;
      }
    }
  }
  return null;
}

export async function getPreviewRunnerRuntimeStatus(): Promise<PreviewRunnerRuntimeStatus> {
  const checkedAt = new Date().toISOString();
  const primaryBase = getEffectiveRunnerUrl();
  const healthPrimary = primaryBase ? await checkRunnerHealth(primaryBase) : null;
  const discoveredBase = healthPrimary ? null : await discoverRunnerUrl();
  const activeBase = healthPrimary ? primaryBase : discoveredBase;
  const health = activeBase ? await checkRunnerHealth(activeBase) : null;

  if (!activeBase || !health) {
    return {
      state: "inactive",
      baseUrl: activeBase ?? null,
      checkedAt,
      startedAt: null,
      uptimeSec: null,
      activeRuns: 0,
      projects: [],
      runs: [],
    };
  }

  const runsResp = await requestRunnerJson(activeBase, "/runs");
  const runtime = runsResp.ok
    ? parseRunnerRuntimeSnapshot(runsResp.data)
    : parseRunnerRuntimeSnapshot(null);
  const runs = runtime.runs;
  const projects = Array.from(
    new Set(runs.map((entry) => entry.projectId).filter((projectId) => projectId.length > 0)),
  );
  const activeRunsFromRuns = runtime.activeRuns;
  const activeRuns =
    typeof activeRunsFromRuns === "number" && Number.isFinite(activeRunsFromRuns)
      ? activeRunsFromRuns
      : typeof health.activeRuns === "number" && Number.isFinite(health.activeRuns)
        ? health.activeRuns
        : 0;

  return {
    state: "active",
    baseUrl: activeBase,
    checkedAt,
    startedAt: runtime.startedAt ?? health.startedAt ?? null,
    uptimeSec:
      runtime.uptimeSec ??
      (typeof health.uptimeSec === "number" && Number.isFinite(health.uptimeSec)
        ? health.uptimeSec
        : null),
    activeRuns,
    projects,
    runs,
  };
}

export async function discoverPreviewRunner(): Promise<void> {
  if (shouldDiscoverRunner()) {
    await discoverRunnerUrl();
  }
}
