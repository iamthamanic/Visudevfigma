import type { Flow, Screen } from "./types";

export interface AnalyzerFramework {
  detected: string[];
  primary: string | null;
  confidence: number;
}

export interface AnalyzerPayload {
  analysisId: string;
  commitSha: string;
  screens: Screen[];
  flows: Flow[];
  framework?: AnalyzerFramework;
}

export interface AnalyzerResponse {
  success: boolean;
  data?: AnalyzerPayload;
  error?: string;
}

export type AnalyzerScreenshotStatus = "ok" | "error";

export interface AnalyzerScreenshotResult {
  screenId: string;
  status: AnalyzerScreenshotStatus;
  url?: string;
  error?: string;
}

export interface AnalyzerScreenshotsPayload {
  captured: number;
  total: number;
  results: AnalyzerScreenshotResult[];
}

export interface AnalyzerScreenshotsResponse {
  success: boolean;
  data?: AnalyzerScreenshotsPayload;
  error?: string;
}
