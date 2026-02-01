import { projectId, publicAnonKey } from "../../utils/supabase/info";

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/visudev-screenshots`;

export type ScreenshotStatus = "ok" | "failed";

export interface ScreenshotScreen {
  id: string;
  path: string;
}

export interface CaptureScreenshotsInput {
  deployedUrl: string;
  repo: string;
  commitSha?: string;
  routePrefix?: string;
  screens: ScreenshotScreen[];
}

export interface ScreenshotResult {
  screenId: string;
  screenshotUrl: string | null;
  status: ScreenshotStatus;
  error?: string;
}

export interface CaptureScreenshotsResponse {
  screenshots: ScreenshotResult[];
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Screenshot API error: ${response.status} - ${errorText}`);
  }

  return response.json() as Promise<T>;
}

export function captureScreenshots(input: CaptureScreenshotsInput) {
  return request<CaptureScreenshotsResponse>("/capture", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function checkScreenshotsHealth() {
  return request<unknown>("/health");
}
