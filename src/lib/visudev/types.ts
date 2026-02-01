// VisuDEV Core Types
export type ScanStatus = "idle" | "running" | "completed" | "failed";
export type ScreenshotStatus = "none" | "pending" | "ok" | "failed";

export interface Screen {
  id: string;
  name: string;
  path: string;
  screenshotUrl?: string;
  screenshotStatus?: ScreenshotStatus;
  filePath?: string;
  type?: "page" | "screen" | "view";
  flows?: string[];
  navigatesTo?: string[];
  framework?: string;
  componentCode?: string;
  lastScreenshotCommit?: string;
  depth?: number;
}

export interface Flow {
  id: string;
  type: "ui-event" | "function-call" | "api-call" | "db-query";
  name: string;
  file: string;
  line: number;
  code: string;
  calls: string[];
  color: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  github_repo?: string;
  github_branch?: string;
  github_access_token?: string;
  deployed_url?: string;
  supabase_project_id?: string;
  supabase_anon_key?: string;
  supabase_management_token?: string;
  screens: Screen[];
  flows: Flow[];
  createdAt: string;
  updatedAt?: string;
}

export interface AnalysisResult {
  screens: Screen[];
  flows: Flow[];
  stats: {
    totalScreens: number;
    totalFlows: number;
    maxDepth: number;
  };
}

export interface ScanResult {
  id: string;
  projectId: string;
  scanType: "appflow" | "blueprint" | "data";
  status: ScanStatus;
  progress: number;
  result?: AnalysisResult;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

export interface ScanStatuses {
  appflow: { status: ScanStatus; progress: number; message?: string; error?: string };
  blueprint: { status: ScanStatus; progress: number; message?: string; error?: string };
  data: { status: ScanStatus; progress: number; message?: string; error?: string };
}
