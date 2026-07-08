/**
 * Shared VisuDEV API types for Local Engine and Frontend clients.
 * Location: shared/visudev-api.types.ts
 */

export type VisuDevMode = "local" | "supabase" | "hybrid";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type AnalysisStatus = "queued" | "running" | "success" | "partial" | "failed";

export type LocalVisuDevProject = {
  id: string;
  name: string;
  repositoryUrl?: string;
  localPath?: string;
  createdAt: string;
  updatedAt: string;
  source: "local";
  preview?: {
    lastRunId?: string;
    lastPreviewUrl?: string;
    status?: "idle" | "starting" | "ready" | "failed" | "stopped";
    updatedAt?: string;
  };
  analysis?: {
    latestBlueprintRunId?: string;
    latestBlueprintStatus?: AnalysisStatus;
    latestAppflowRunId?: string;
    latestAppflowStatus?: AnalysisStatus;
    updatedAt?: string;
  };
};

export type ProjectsIndex = {
  version: 1;
  projects: LocalVisuDevProject[];
};

export type CreateProjectInput = {
  name: string;
  repositoryUrl?: string;
  localPath?: string;
};

export type UpdateProjectInput = {
  name?: string;
  repositoryUrl?: string | null;
  localPath?: string | null;
};

export type AnalyzeProjectRequest = {
  scanType: "blueprint" | "appflow" | "data" | "all";
  localPath?: string;
  repositoryUrl?: string;
  branchOrCommit?: string;
};

export type StartAnalysisResponse = {
  projectId: string;
  runId: string;
  scanType: "blueprint" | "appflow";
  status: "queued" | "running";
  statusUrl: string;
  resultUrl: string;
};

export type AnalysisRunStatus = {
  projectId: string;
  runId: string;
  scanType: string;
  status: AnalysisStatus;
  startedAt?: string;
  finishedAt?: string;
  error?: ApiFailure["error"];
};

export type BlueprintDocument = Record<string, unknown>;

export type LocalBlueprintAnalysisResult = {
  kind: "blueprint";
  projectId: string;
  runId: string;
  providerId: "legacy-blueprint-runner";
  status: "success" | "partial" | "failed";
  createdAt: string;
  summary: {
    routesDetected: number;
    findings: number;
    filesAnalyzed?: number;
    warnings: number;
    errors: number;
  };
  blueprint: BlueprintDocument;
  raw?: unknown;
};

export type LocalAppflowAnalysisResult = {
  kind: "appflow";
  projectId: string;
  runId: string;
  providerId: "legacy-appflow-runner";
  status: "success" | "partial" | "failed";
  createdAt: string;
  summary: {
    screensDetected: number;
    flowsDetected: number;
    filesAnalyzed?: number;
    warnings: number;
    errors: number;
  };
  screens: unknown[];
  flows: unknown[];
  graph?: unknown;
  quality?: unknown;
  framework?: unknown;
  commitSha?: string;
  raw?: unknown;
};

export type LocalUnsupportedAnalysisResult = {
  kind: "unsupported";
  scanType: string;
  message: string;
};

export type LocalFailedAnalysisResult = {
  kind: "failed";
  projectId: string;
  runId: string;
  status: "failed";
  error: ApiFailure["error"];
};

export type LocalEngineAnalysisResult =
  | LocalBlueprintAnalysisResult
  | LocalAppflowAnalysisResult
  | LocalUnsupportedAnalysisResult
  | LocalFailedAnalysisResult;

export type LocalBlueprintLatest = {
  projectId: string;
  runId: string;
  blueprint: BlueprintDocument;
  updatedAt: string;
};

export type LocalAppflowLatest = {
  projectId: string;
  runId: string;
  screens: unknown[];
  flows: unknown[];
  graph?: unknown;
  quality?: unknown;
  framework?: unknown;
  commitSha?: string;
  updatedAt: string;
};

export type StartPreviewInput = {
  projectId: string;
  repo?: string;
  repositoryUrl?: string;
  localPath?: string;
  branchOrCommit?: string;
  commitSha?: string;
  bootMode?: "best_effort" | "strict";
  injectSupabasePlaceholders?: boolean | null;
};

export type PreviewStartResult = {
  projectId: string;
  runId: string;
  status: "starting" | "ready" | "failed";
  previewUrl?: string;
  reusedExistingRun?: boolean;
};

export type PreviewStatusResult = {
  projectId: string;
  runId?: string;
  status: "idle" | "starting" | "ready" | "failed" | "stopped";
  previewUrl?: string;
  error?: ApiFailure["error"];
};

export type PreviewStopResult = {
  projectId: string;
  status: "stopped" | "failed" | "not_implemented";
  error?: ApiFailure["error"];
};

export type BrowseLocalPathInput = {
  startDir?: string;
};

export type BrowseLocalPathResult =
  | { cancelled: true; path?: never; displayPath?: never }
  | { cancelled: false; path: string; displayPath: string };

export type VisuDevHealth = {
  ok: boolean;
  service: string;
  mode: VisuDevMode;
  version: string;
  dependencies?: {
    previewRunner?: { reachable: boolean; url: string };
    deno?: { available: boolean; version: string | null; requiredFor: string[] };
  };
};

export type VisuDevCapabilities = {
  mode: VisuDevMode;
  scans: {
    blueprint: boolean;
    appflow: boolean;
    data: boolean;
    all: boolean;
  };
  preview: boolean;
  browseLocalPath: boolean;
};

export type LocalPreviewMapping = {
  projectId: string;
  runId: string;
  projectToken?: string;
  runnerUrl: string;
  previewUrl?: string;
  status: "starting" | "ready" | "failed" | "stopped" | "idle";
  startedAt: string;
  updatedAt: string;
  input: {
    repo?: string;
    repositoryUrl?: string;
    localPath?: string;
    branchOrCommit?: string;
    commitSha?: string;
    bootMode?: "best_effort" | "strict";
    injectSupabasePlaceholders?: boolean | null;
  };
};

export type EngineAnalysisRun = {
  runId: string;
  projectId: string;
  scanType: "blueprint" | "appflow";
  providerId: "legacy-blueprint-runner" | "legacy-appflow-runner";
  runnerAnalysisId?: string;
  status: AnalysisStatus;
  createdAt: string;
  updatedAt: string;
  error?: ApiFailure["error"];
};
