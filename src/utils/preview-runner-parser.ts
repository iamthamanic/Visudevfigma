import type {
  PreviewRunnerRunInfo,
  PreviewStepLog,
  RunnerPreviewStatus,
} from "./preview-runner-types";
import {
  sanitizeProjectId,
  sanitizeProjectToken,
  sanitizeRunId,
} from "./preview-runner-validation";

const RUNNER_PREVIEW_STATUS_SET = new Set<RunnerPreviewStatus>([
  "idle",
  "starting",
  "ready",
  "failed",
  "stopped",
]);

export interface RunnerHealthPayload {
  ok?: boolean;
  service?: string;
  port?: number;
  startedAt?: string;
  uptimeSec?: number;
  activeRuns?: number;
}

export function warnRunner(context: string, error?: unknown): void {
  const message =
    error instanceof Error ? error.message : error != null ? String(error) : "unknown error";
  console.warn(`[preview-runner-api] ${context}: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseRunnerStatus(value: unknown): RunnerPreviewStatus | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim() as RunnerPreviewStatus;
  return RUNNER_PREVIEW_STATUS_SET.has(normalized) ? normalized : null;
}

export function parseRunnerError(payload: unknown, fallbackStatus: number): string {
  if (isRecord(payload)) {
    const error = readString(payload.error);
    if (error) return error;
  }
  return String(fallbackStatus);
}

export function parseRunnerJsonText(text: string, context: string): unknown | null {
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    warnRunner(`${context}: invalid JSON`, error);
    return null;
  }
}

function parseRunnerStepLogs(value: unknown): PreviewStepLog[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const logs: PreviewStepLog[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const time = readString(entry.time);
    const message = readString(entry.message);
    if (!time || !message) continue;
    logs.push({ time, message });
  }
  return logs;
}

function parseRunnerRunInfo(value: unknown): PreviewRunnerRunInfo | null {
  if (!isRecord(value)) return null;
  const runIdRaw = readString(value.runId);
  const runId = runIdRaw ? sanitizeRunId(runIdRaw) : null;
  if (!runId) return null;
  const projectIdRaw = readString(value.projectId);
  const projectId = projectIdRaw ? (sanitizeProjectId(projectIdRaw) ?? "") : "";
  return {
    runId,
    projectId,
    repo: readString(value.repo) ?? "",
    branchOrCommit: readString(value.branchOrCommit) ?? "",
    status: readString(value.status) ?? "unknown",
    previewUrl: readNullableString(value.previewUrl),
    startedAt: readNullableString(value.startedAt),
    readyAt: readNullableString(value.readyAt),
    stoppedAt: readNullableString(value.stoppedAt),
  };
}

export function parseRunnerHealthPayload(value: unknown): RunnerHealthPayload | null {
  if (!isRecord(value) || value.ok !== true) return null;
  return {
    ok: true,
    service: readString(value.service) ?? undefined,
    port: readFiniteNumber(value.port) ?? undefined,
    startedAt: readNullableString(value.startedAt) ?? undefined,
    uptimeSec: readFiniteNumber(value.uptimeSec) ?? undefined,
    activeRuns: readFiniteNumber(value.activeRuns) ?? undefined,
  };
}

export function parseRunnerRuntimeSnapshot(value: unknown): {
  runs: PreviewRunnerRunInfo[];
  startedAt: string | null;
  uptimeSec: number | null;
  activeRuns: number | null;
} {
  if (!isRecord(value)) {
    return { runs: [], startedAt: null, uptimeSec: null, activeRuns: null };
  }

  const runsRaw = Array.isArray(value.runs) ? value.runs : [];
  const runs = runsRaw
    .map(parseRunnerRunInfo)
    .filter((entry): entry is PreviewRunnerRunInfo => entry != null);

  let startedAt: string | null = null;
  let uptimeSec: number | null = null;
  if (isRecord(value.runner)) {
    startedAt = readNullableString(value.runner.startedAt);
    uptimeSec = readFiniteNumber(value.runner.uptimeSec);
  }

  let activeRuns: number | null = null;
  if (isRecord(value.totals)) {
    activeRuns = readFiniteNumber(value.totals.active);
  }

  return { runs, startedAt, uptimeSec, activeRuns };
}

export function parseRunnerStartPayload(value: unknown): {
  runId: string;
  status: RunnerPreviewStatus;
  projectToken: string | null;
} | null {
  if (!isRecord(value)) return null;
  const runIdRaw = readString(value.runId);
  const runId = runIdRaw ? sanitizeRunId(runIdRaw) : null;
  if (!runId) return null;
  const status = parseRunnerStatus(value.status) ?? "starting";
  const projectTokenRaw = readString(value.projectToken);
  const projectToken = projectTokenRaw ? sanitizeProjectToken(projectTokenRaw) : null;
  return { runId, status, projectToken };
}

export function parseRunnerStatusPayload(value: unknown): {
  status: RunnerPreviewStatus;
  previewUrl?: string;
  error?: string;
  logs?: PreviewStepLog[];
} | null {
  if (!isRecord(value)) return null;
  const status = parseRunnerStatus(value.status);
  if (!status) return null;
  const previewUrl = readString(value.previewUrl) ?? undefined;
  const error = readString(value.error) ?? undefined;
  const logs = parseRunnerStepLogs(value.logs);
  return { status, previewUrl, error, logs };
}
