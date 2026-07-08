/**
 * @deprecated Local-first mode must call Local Engine via VisuDevApiClient.
 * Direct Frontend → Runner access is kept only as legacy/debug fallback.
 * Location: src/lib/visudev/blueprint-runner-client.ts
 */

import { guestRequestHeader } from "./guest-mode";

const RUNNER_PORT_CANDIDATES = [4000, 4100, 4110, 4120, 4130, 4140];

const envRunnerUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_PREVIEW_RUNNER_URL) || "";

let discoveredRunnerUrl: string | null = null;

async function checkRunnerHealth(baseUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.status === 200;
  } catch {
    return false;
  }
}

async function discoverRunnerUrl(): Promise<string | null> {
  const hosts = ["127.0.0.1", "localhost"];
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

export async function getBlueprintRunnerBaseUrl(): Promise<string | null> {
  const cached = discoveredRunnerUrl ?? envRunnerUrl;
  if (cached && (await checkRunnerHealth(cached))) {
    return cached.replace(/\/$/, "");
  }
  return discoverRunnerUrl();
}

export interface LocalBlueprintAnalyzeResult {
  success: boolean;
  data?: {
    blueprint: Record<string, unknown>;
    analysisId: string;
    filesAnalyzed?: number;
    workspaceRoot?: string;
  };
  error?: string;
}

export async function analyzeBlueprintViaRunner(input: {
  projectId: string;
  localPath: string;
}): Promise<LocalBlueprintAnalyzeResult> {
  const base = await getBlueprintRunnerBaseUrl();
  if (!base) {
    return {
      success: false,
      error:
        "Preview Runner nicht erreichbar. Im Projektordner: npm run dev (startet Runner + Supabase).",
    };
  }

  try {
    const res = await fetch(`${base}/blueprint/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...guestRequestHeader(),
      },
      body: JSON.stringify({
        projectId: input.projectId,
        localPath: input.localPath,
      }),
    });

    const text = await res.text();
    let parsed: LocalBlueprintAnalyzeResult & { error?: string };
    try {
      parsed = text ? (JSON.parse(text) as typeof parsed) : { success: false };
    } catch {
      return { success: false, error: "Runner response is not JSON" };
    }

    if (!res.ok) {
      return {
        success: false,
        error: parsed.error || `Runner error ${res.status}`,
      };
    }

    if (!parsed.success || !parsed.data?.blueprint) {
      return {
        success: false,
        error: parsed.error || "Blueprint analyzer returned no data",
      };
    }

    return parsed;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
