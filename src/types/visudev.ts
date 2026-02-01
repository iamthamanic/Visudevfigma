/**
 * VisuDEV Central Type Definitions
 * Shared between frontend and backend
 */

export type ScreenshotStatus = "none" | "pending" | "ok" | "failed";

export interface Screen {
  id: string;
  name: string;
  path: string;
  file: string; // File path in repo
  type: "page" | "screen" | "view";
  flows: string[]; // IDs of flows in this screen
  navigatesTo: string[]; // Paths this screen navigates to
  framework: string; // e.g., "nextjs-app", "react-router", "nuxt"

  // Component code for fallback preview
  componentCode?: string;

  // NEW: Commit & Screenshot tracking
  lastAnalyzedCommit?: string; // Commit SHA for which this screen data was produced
  screenshotUrl?: string | null; // Public URL in Supabase Storage
  lastScreenshotCommit?: string; // Commit SHA used for the current screenshot
  screenshotStatus?: ScreenshotStatus;
}

export interface CodeFlow {
  id: string;
  type: "ui-event" | "function-call" | "api-call" | "db-query";
  name: string;
  file: string;
  line: number;
  code: string;
  calls: string[]; // IDs of other flows this calls
  color: string;
}

export interface FrameworkInfo {
  detected: string[];
  primary: string | null;
  confidence: number;
}

export interface AnalysisResult {
  commitSha: string;
  screens: Screen[];
  flows: CodeFlow[];
  framework: FrameworkInfo;
}

export interface ScreenshotRequest {
  repo: string; // "owner/name"
  branch: string; // "main"
  commitSha: string; // from analyzer
  access_token: string; // GitHub token for private repos
  screens: {
    id: string;
    path: string;
  }[];
}

export interface ScreenshotResult {
  screenId: string;
  screenshotUrl: string | null;
  status: "ok" | "failed";
  error?: string;
}

export interface ScreenshotResponse {
  screenshots: ScreenshotResult[];
}
