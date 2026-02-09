/**
 * VisuDEV API Client
 * Frontend integration for all Edge Functions
 */

import type { AccountPreferencesUpdateInput, AccountUpdateInput } from "../lib/visudev/account";
import type {
  IntegrationsState,
  IntegrationsUpdateInput,
  GitHubRepo,
} from "../lib/visudev/integrations";
import type { PreviewMode, Project } from "../lib/visudev/types";
import type {
  AppFlowCreateInput,
  AppFlowRecord,
  AppFlowUpdateInput,
} from "../modules/appflow/types";
import type { BlueprintData, BlueprintUpdateInput } from "../modules/blueprint/types";
import type {
  DataSchema,
  DataSchemaUpdateInput,
  ERDData,
  ERDUpdateInput,
  MigrationEntry,
} from "../modules/data/types";
import type { LogCreateInput, LogEntry } from "../modules/logs/types";
import type { ProjectCreateInput, ProjectUpdateInput } from "../modules/projects/types";
import { publicAnonKey, supabaseUrl } from "./supabase/info";

const BASE_URL = `${supabaseUrl}/functions/v1`;

export interface ApiRequestOptions extends RequestInit {
  /** When set, used as Bearer token instead of anon key (e.g. user session for integrations/auth). */
  accessToken?: string | null;
}

// Base fetch wrapper with auth
async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<{ success: boolean; data?: T; error?: string }> {
  const { accessToken, ...fetchOptions } = options;
  const authHeader =
    accessToken != null && accessToken !== "" ? `Bearer ${accessToken}` : `Bearer ${publicAnonKey}`;

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        ...fetchOptions.headers,
      },
    });

    const text = await response.text();
    let result: { success?: boolean; error?: string; [key: string]: unknown };
    try {
      result = text ? (JSON.parse(text) as typeof result) : {};
    } catch {
      console.error(`API [${endpoint}]: response is not JSON`, text.slice(0, 150));
      const isPreview = endpoint.includes("preview");
      const is404 = response.status === 404;
      let errorMsg: string;
      if (response.ok === false) {
        if (is404 && isPreview) {
          errorMsg =
            "Edge Function 'visudev-preview' nicht gefunden (404). " +
            "Lokal: npm run dev ausführen (startet Runner + Vite; Preview nutzt automatisch localhost:4000). " +
            "Oder deployen: supabase functions deploy visudev-preview und PREVIEW_RUNNER_URL in Supabase → Edge Functions → Secrets setzen (Runner-API-URL, z.B. https://dein-runner.example.com; der Runner vergibt intern freie Ports pro Preview).";
        } else {
          errorMsg = `Server error ${response.status}. Check that Edge Functions are deployed and reachable.`;
        }
      } else {
        errorMsg =
          "Server returned invalid response (not JSON). Check network and Edge Function URL.";
      }
      return { success: false, error: errorMsg };
    }

    if (!response.ok) {
      console.error(`API Error [${endpoint}]:`, result.error || response.statusText);
      const isPreview = endpoint.includes("preview");
      const is404 = response.status === 404;
      const error =
        (result.error as string) ||
        (is404 && isPreview
          ? "Edge Function 'visudev-preview' nicht gefunden (404). Lokal: npm run dev ausführen (Runner + Vite). Oder deployen und PREVIEW_RUNNER_URL (Runner-API-URL) in Secrets setzen."
          : response.statusText);
      return { success: false, error };
    }

    return { ...result, success: result.success !== false };
  } catch (error) {
    console.error(`Network Error [${endpoint}]:`, error);
    return { success: false, error: String(error) };
  }
}

// ==================== PROJECTS ====================

export const projectsAPI = {
  // Get all projects
  getAll: () => apiRequest<Project[]>("/visudev-projects"),

  // Get single project
  get: (id: string) => apiRequest<Project>(`/visudev-projects/${id}`),

  // Create project
  create: (data: ProjectCreateInput) =>
    apiRequest<Project>("/visudev-projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update project
  update: (id: string, data: ProjectUpdateInput) =>
    apiRequest(`/visudev-projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete project
  delete: (id: string) =>
    apiRequest(`/visudev-projects/${id}`, {
      method: "DELETE",
    }),
};

// ==================== APP FLOW ====================

export const appflowAPI = {
  // Get all flows for project
  getAll: (projectId: string) => apiRequest<AppFlowRecord[]>(`/visudev-appflow/${projectId}`),

  // Get single flow
  get: (projectId: string, flowId: string) =>
    apiRequest<AppFlowRecord>(`/visudev-appflow/${projectId}/${flowId}`),

  // Create flow
  create: (projectId: string, data: AppFlowCreateInput) =>
    apiRequest(`/visudev-appflow/${projectId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update flow
  update: (projectId: string, flowId: string, data: AppFlowUpdateInput) =>
    apiRequest(`/visudev-appflow/${projectId}/${flowId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete flow
  delete: (projectId: string, flowId: string) =>
    apiRequest(`/visudev-appflow/${projectId}/${flowId}`, {
      method: "DELETE",
    }),
};

// ==================== BLUEPRINT ====================

export const blueprintAPI = {
  // Get blueprint for project
  get: (projectId: string) => apiRequest<BlueprintData>(`/visudev-blueprint/${projectId}`),

  // Update blueprint
  update: (projectId: string, data: BlueprintUpdateInput) =>
    apiRequest(`/visudev-blueprint/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete blueprint
  delete: (projectId: string) =>
    apiRequest(`/visudev-blueprint/${projectId}`, {
      method: "DELETE",
    }),
};

// ==================== DATA ====================

export const dataAPI = {
  // Schema
  getSchema: (projectId: string) => apiRequest<DataSchema>(`/visudev-data/${projectId}/schema`),

  updateSchema: (projectId: string, data: DataSchemaUpdateInput) =>
    apiRequest(`/visudev-data/${projectId}/schema`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Migrations
  getMigrations: (projectId: string) =>
    apiRequest<MigrationEntry[]>(`/visudev-data/${projectId}/migrations`),

  updateMigrations: (projectId: string, data: MigrationEntry[]) =>
    apiRequest(`/visudev-data/${projectId}/migrations`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // ERD
  getERD: (projectId: string) => apiRequest<ERDData>(`/visudev-data/${projectId}/erd`),

  updateERD: (projectId: string, data: ERDUpdateInput) =>
    apiRequest(`/visudev-data/${projectId}/erd`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ==================== LOGS ====================

export const logsAPI = {
  // Get all logs for project
  getAll: (projectId: string) => apiRequest<LogEntry[]>(`/visudev-logs/${projectId}`),

  // Get single log
  get: (projectId: string, logId: string) =>
    apiRequest<LogEntry>(`/visudev-logs/${projectId}/${logId}`),

  // Create log entry
  create: (projectId: string, data: LogCreateInput) =>
    apiRequest(`/visudev-logs/${projectId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Delete all logs for project
  deleteAll: (projectId: string) =>
    apiRequest(`/visudev-logs/${projectId}`, {
      method: "DELETE",
    }),

  // Delete single log
  delete: (projectId: string, logId: string) =>
    apiRequest(`/visudev-logs/${projectId}/${logId}`, {
      method: "DELETE",
    }),
};

// ==================== ACCOUNT ====================

export const accountAPI = {
  // Get account settings
  get: (userId: string) => apiRequest(`/visudev-account/${userId}`),

  // Update account settings
  update: (userId: string, data: AccountUpdateInput) =>
    apiRequest(`/visudev-account/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Get preferences
  getPreferences: (userId: string) => apiRequest(`/visudev-account/${userId}/preferences`),

  // Update preferences
  updatePreferences: (userId: string, data: AccountPreferencesUpdateInput) =>
    apiRequest(`/visudev-account/${userId}/preferences`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ==================== INTEGRATIONS ====================

export const integrationsAPI = {
  // Get all integrations
  get: (projectId: string) => apiRequest<IntegrationsState>(`/visudev-integrations/${projectId}`),

  // Update integrations
  update: (projectId: string, data: IntegrationsUpdateInput) =>
    apiRequest(`/visudev-integrations/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // GitHub
  github: {
    // Connect GitHub (manual token)
    connect: (projectId: string, token: string, username?: string) =>
      apiRequest(`/visudev-integrations/${projectId}/github`, {
        method: "POST",
        body: JSON.stringify({ token, username }),
      }),

    // Set project GitHub repo from user-scoped OAuth (Bearer required)
    setProjectGitHubRepo: (
      projectId: string,
      payload: { repo: string; branch?: string },
      accessToken: string,
    ) =>
      apiRequest(`/visudev-integrations/${projectId}/github`, {
        method: "PUT",
        body: JSON.stringify(payload),
        accessToken,
      }),

    // Get repositories (Bearer required for user-scoped token)
    getRepos: (projectId: string, accessToken?: string | null) =>
      apiRequest<GitHubRepo[]>(
        `/visudev-integrations/${projectId}/github/repos`,
        accessToken != null && accessToken !== "" ? { accessToken } : {},
      ),

    // Get branches
    getBranches: (projectId: string, owner: string, repo: string) =>
      apiRequest(`/visudev-integrations/${projectId}/github/branches?owner=${owner}&repo=${repo}`),

    // Get file/directory content
    getContent: (
      projectId: string,
      owner: string,
      repo: string,
      path: string = "",
      ref: string = "main",
    ) =>
      apiRequest(
        `/visudev-integrations/${projectId}/github/content?owner=${owner}&repo=${repo}&path=${path}&ref=${ref}`,
      ),

    // Disconnect GitHub
    disconnect: (projectId: string) =>
      apiRequest(`/visudev-integrations/${projectId}/github`, {
        method: "DELETE",
      }),
  },

  // Supabase
  supabase: {
    // Connect Supabase
    connect: (
      projectId: string,
      url: string,
      anonKey: string,
      serviceKey?: string,
      projectRef?: string,
    ) =>
      apiRequest(`/visudev-integrations/${projectId}/supabase`, {
        method: "POST",
        body: JSON.stringify({ url, anonKey, serviceKey, projectRef }),
      }),

    // Get Supabase info
    getInfo: (projectId: string) => apiRequest(`/visudev-integrations/${projectId}/supabase`),

    // Disconnect Supabase
    disconnect: (projectId: string) =>
      apiRequest(`/visudev-integrations/${projectId}/supabase`, {
        method: "DELETE",
      }),
  },
};

// ==================== PREVIEW (Live App) ====================

/** When set (e.g. http://localhost:4000), frontend calls the Preview Runner directly; no Edge Function or Supabase secret needed. In dev we default to localhost:4000 so "npm run dev" works without .env. */
const localRunnerUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_PREVIEW_RUNNER_URL) ||
  (typeof import.meta !== "undefined" && import.meta.env?.DEV ? "http://localhost:4000" : "") ||
  "";

/** Nach fehlgeschlagenem Request ggf. gefundene Runner-URL (z. B. wenn Runner auf 4100 läuft). */
let discoveredRunnerUrl: string | null = null;

const RUNNER_PORT_CANDIDATES = [4000, 4100, 4110, 4120, 4130];

/** Prüft, ob eine URL mit /health erreichbar ist (kurzer Timeout). */
async function checkRunnerHealth(baseUrl: string): Promise<boolean> {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 1500);
    const r = await fetch(`${baseUrl.replace(/\/$/, "")}/health`, {
      method: "GET",
      signal: c.signal,
    });
    clearTimeout(t);
    return r.status === 200;
  } catch {
    return false;
  }
}

/** Sucht unter Kandidaten-Ports (4000, 4100, …) nach einem laufenden Runner; setzt discoveredRunnerUrl. */
async function discoverRunnerUrl(): Promise<string | null> {
  const hosts = ["localhost", "127.0.0.1"];
  for (const port of RUNNER_PORT_CANDIDATES) {
    for (const host of hosts) {
      const url = `http://${host}:${port}`;
      if (await checkRunnerHealth(url)) {
        discoveredRunnerUrl = url;
        return url;
      }
    }
  }
  return null;
}

/** URL für den lokalen Runner (env oder zuvor per Discovery gefunden). */
function getEffectiveRunnerUrl(): string {
  return discoveredRunnerUrl ?? localRunnerUrl;
}

function resolvePreviewMode(previewMode?: PreviewMode): "local" | "central" | "deployed" {
  if (previewMode === "local") return "local";
  if (previewMode === "central") return "central";
  if (previewMode === "deployed") return "deployed";
  return localRunnerUrl ? "local" : "central";
}

function localRunnerGuard(): { ok: boolean; error?: string } {
  const url = getEffectiveRunnerUrl();
  if (!url) {
    return {
      ok: false,
      error: "VisuDEV starten (im Projektordner: npm run dev), dann erneut versuchen.",
    };
  }
  return { ok: true };
}

/** projectId -> runId when using local runner */
const localRunIds = new Map<string, string>();

const PREVIEW_RUNID_KEY = "visudev_preview_runId_";

function getStoredRunId(projectId: string): string | null {
  let runId = localRunIds.get(projectId) ?? null;
  if (!runId && typeof localStorage !== "undefined") {
    runId = localStorage.getItem(PREVIEW_RUNID_KEY + projectId);
    if (runId) localRunIds.set(projectId, runId);
  }
  return runId;
}

function setStoredRunId(projectId: string, runId: string): void {
  localRunIds.set(projectId, runId);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(PREVIEW_RUNID_KEY + projectId, runId);
  }
}

function clearStoredRunId(projectId: string): void {
  localRunIds.delete(projectId);
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(PREVIEW_RUNID_KEY + projectId);
  }
}

async function localPreviewStart(
  projectId: string,
  options?: { repo?: string; branchOrCommit?: string; commitSha?: string },
): Promise<{ success: boolean; data?: { runId: string; status: string }; error?: string }> {
  let base = getEffectiveRunnerUrl().replace(/\/$/, "");
  const body = JSON.stringify({
    projectId,
    repo: options?.repo,
    branchOrCommit: options?.branchOrCommit ?? "main",
    commitSha: options?.commitSha ?? undefined,
  });

  const doFetch = async (urlBase: string): Promise<{ res: Response; text: string }> => {
    const res = await fetch(`${urlBase}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const text = await res.text();
    return { res, text };
  };

  let res: Response;
  let text = "";
  try {
    const out = await doFetch(base);
    res = out.res;
    text = out.text;
  } catch {
    const found = await discoverRunnerUrl();
    if (found) {
      base = found.replace(/\/$/, "");
      try {
        const out = await doFetch(base);
        res = out.res;
        text = out.text;
      } catch {
        return {
          success: false,
          error: `Preview Runner nicht erreichbar. Läuft der Runner? (lokal: ${base})`,
        };
      }
    } else {
      return {
        success: false,
        error: `Preview Runner nicht erreichbar. Läuft der Runner? (lokal: http://localhost:4000)`,
      };
    }
  }
  let data: { success?: boolean; runId?: string; status?: string; error?: string };
  try {
    data = text ? (JSON.parse(text) as typeof data) : {};
  } catch {
    return { success: false, error: "Runner response not JSON" };
  }
  if (!res.ok) return { success: false, error: (data.error as string) || String(res.status) };
  if (data.runId) setStoredRunId(projectId, data.runId);
  return { success: true, data: { runId: data.runId!, status: data.status ?? "starting" } };
}

async function localPreviewStatus(projectId: string): Promise<{
  success: boolean;
  status?: "idle" | "starting" | "ready" | "failed" | "stopped";
  previewUrl?: string;
  error?: string;
  logs?: PreviewStepLog[];
}> {
  const runId = getStoredRunId(projectId);
  if (!runId) return { success: true, status: "idle" };
  let base = getEffectiveRunnerUrl().replace(/\/$/, "");
  let res: Response;
  let text: string;
  try {
    res = await fetch(`${base}/status/${encodeURIComponent(runId)}`);
    text = await res.text();
  } catch {
    const found = await discoverRunnerUrl();
    if (found) {
      base = found.replace(/\/$/, "");
      try {
        res = await fetch(`${base}/status/${encodeURIComponent(runId)}`);
        text = await res.text();
      } catch {
        return {
          success: false,
          error: `Preview Runner nicht erreichbar. Läuft der Runner? (lokal: ${base})`,
        };
      }
    } else {
      return {
        success: false,
        error: "Preview Runner nicht erreichbar. Läuft der Runner? (lokal: http://localhost:4000)",
      };
    }
  }
  let data: {
    success?: boolean;
    status?: string;
    previewUrl?: string;
    error?: string;
    logs?: PreviewStepLog[];
  };
  try {
    data = text ? (JSON.parse(text) as typeof data) : {};
  } catch {
    return { success: false, error: "Runner response not JSON" };
  }
  if (!res.ok) {
    if (res.status === 404) {
      clearStoredRunId(projectId);
      return { success: true, status: "idle" };
    }
    return { success: false, error: (data.error as string) || String(res.status) };
  }
  const status = (data.status as PreviewStatusResponse["status"]) ?? "idle";
  if (status === "idle") clearStoredRunId(projectId);
  return {
    success: true,
    status,
    previewUrl: data.previewUrl,
    error: data.error,
    logs: Array.isArray(data.logs) ? data.logs : undefined,
  };
}

async function localPreviewStop(projectId: string): Promise<{ success: boolean; error?: string }> {
  const runId = getStoredRunId(projectId);
  if (!runId) return { success: true };
  const base = getEffectiveRunnerUrl().replace(/\/$/, "");
  const res = await fetch(`${base}/stop/${encodeURIComponent(runId)}`, { method: "POST" });
  clearStoredRunId(projectId);
  const text = await res.text();
  let data: { success?: boolean; error?: string };
  try {
    data = text ? (JSON.parse(text) as typeof data) : {};
  } catch {
    return { success: false, error: "Runner response not JSON" };
  }
  if (!res.ok) {
    if (res.status === 404) clearStoredRunId(projectId);
    return { success: false, error: (data.error as string) || String(res.status) };
  }
  return { success: true };
}

/** Refresh preview: pull latest from repo, rebuild, restart (live update). Only with local runner. */
async function localPreviewRefresh(
  projectId: string,
): Promise<{ success: boolean; error?: string }> {
  const runId = getStoredRunId(projectId);
  if (!runId)
    return {
      success: false,
      error: "Kein aktiver Preview für dieses Projekt (Seite neu laden und Preview neu starten).",
    };
  const base = getEffectiveRunnerUrl().replace(/\/$/, "");
  const res = await fetch(`${base}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ runId }),
  });
  const text = await res.text();
  let data: { success?: boolean; error?: string };
  try {
    data = text ? (JSON.parse(text) as typeof data) : {};
  } catch {
    return { success: false, error: "Runner response not JSON" };
  }
  if (!res.ok) {
    if (res.status === 404) clearStoredRunId(projectId);
    return { success: false, error: (data.error as string) || String(res.status) };
  }
  return { success: true };
}

/** Single log line from preview start/refresh (Runner or Edge). */
export interface PreviewStepLog {
  time: string;
  message: string;
}

export interface PreviewStatusResponse {
  success: boolean;
  status?: "idle" | "starting" | "ready" | "failed" | "stopped";
  previewUrl?: string;
  error?: string;
  startedAt?: string;
  expiresAt?: string;
  logs?: PreviewStepLog[];
}

/** Läuft einmal im Hintergrund, um den Runner zu finden (z. B. auf Port 4100), wenn 4000 nicht erreichbar ist. Beim ersten Start/Status wird die gefundene URL gecacht. */
export async function discoverPreviewRunner(): Promise<void> {
  if (localRunnerUrl || (typeof import.meta !== "undefined" && import.meta.env?.DEV)) {
    await discoverRunnerUrl();
  }
}

export const previewAPI = {
  /** Start preview (build/run app from repo via Preview Runner). Pass repo/branch/commitSha when project not in backend KV. */
  start: async (
    projectId: string,
    options?: { repo?: string; branchOrCommit?: string; commitSha?: string },
    previewMode?: PreviewMode,
  ): Promise<{ success: boolean; data?: { runId: string; status: string }; error?: string }> => {
    const mode = resolvePreviewMode(previewMode);
    if (mode === "deployed") {
      return {
        success: false,
        error: "Preview-Modus ist 'Deployed URL'. Bitte eine URL im Projekt hinterlegen.",
      };
    }
    if (mode === "local") {
      const guard = localRunnerGuard();
      if (!guard.ok) return { success: false, error: guard.error };
      const out = await localPreviewStart(projectId, options);
      return out.data ? { ...out, data: out.data } : out;
    }
    return apiRequest<{ runId: string; status: string }>("/visudev-preview/preview/start", {
      method: "POST",
      body: JSON.stringify({
        projectId,
        repo: options?.repo,
        branchOrCommit: options?.branchOrCommit,
        commitSha: options?.commitSha,
      }),
    });
  },

  /** Get preview status and URL */
  status: async (projectId: string, previewMode?: PreviewMode) => {
    const mode = resolvePreviewMode(previewMode);
    if (mode === "deployed") {
      return { success: true, status: "idle" as const };
    }
    if (mode === "local") {
      const guard = localRunnerGuard();
      if (!guard.ok) return { success: false, error: guard.error };
      return localPreviewStatus(projectId);
    }
    return apiRequest<PreviewStatusResponse>(
      `/visudev-preview/preview/status?projectId=${encodeURIComponent(projectId)}`,
    );
  },

  /** Stop preview */
  stop: async (
    projectId: string,
    previewMode?: PreviewMode,
  ): Promise<{ success: boolean; error?: string }> => {
    const mode = resolvePreviewMode(previewMode);
    if (mode === "deployed") {
      return { success: true };
    }
    if (mode === "local") {
      const guard = localRunnerGuard();
      if (!guard.ok) return { success: false, error: guard.error };
      return localPreviewStop(projectId);
    }
    return apiRequest<{ status: string }>("/visudev-preview/preview/stop", {
      method: "POST",
      body: JSON.stringify({ projectId }),
    });
  },

  /** Refresh preview: pull latest from repo, rebuild, restart (live). Only with local runner. */
  refresh: async (
    projectId: string,
    previewMode?: PreviewMode,
  ): Promise<{ success: boolean; error?: string }> => {
    const mode = resolvePreviewMode(previewMode);
    if (mode === "deployed") {
      return { success: false, error: "Refresh nicht verfügbar im Modus 'Deployed URL'." };
    }
    if (mode === "local") {
      const guard = localRunnerGuard();
      if (!guard.ok) return { success: false, error: guard.error };
      return localPreviewRefresh(projectId);
    }
    return { success: false, error: "Refresh only with local runner (VITE_PREVIEW_RUNNER_URL)" };
  },
};

// Export all APIs
export const api = {
  projects: projectsAPI,
  appflow: appflowAPI,
  blueprint: blueprintAPI,
  data: dataAPI,
  logs: logsAPI,
  account: accountAPI,
  integrations: integrationsAPI,
  preview: previewAPI,
};
