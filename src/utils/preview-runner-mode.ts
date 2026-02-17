import type { PreviewMode } from "../lib/visudev/types";

/** When set (e.g. http://localhost:4000), frontend calls the Preview Runner directly; no Edge Function or Supabase secret needed. In dev we default to localhost:4000 so "npm run dev" works without .env. */
const localRunnerUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_PREVIEW_RUNNER_URL) ||
  (typeof import.meta !== "undefined" && import.meta.env?.DEV ? "http://localhost:4000" : "") ||
  "";

/** Nach fehlgeschlagenem Request ggf. gefundene Runner-URL (z. B. wenn Runner auf 4100 läuft). */
let discoveredRunnerUrl: string | null = null;

export function getEffectiveRunnerUrl(): string {
  return discoveredRunnerUrl ?? localRunnerUrl;
}

export function setDiscoveredRunnerUrl(url: string): void {
  discoveredRunnerUrl = url;
}

export function shouldDiscoverRunner(): boolean {
  return Boolean(localRunnerUrl || (typeof import.meta !== "undefined" && import.meta.env?.DEV));
}

export function resolvePreviewMode(previewMode?: PreviewMode): "local" | "central" | "deployed" {
  if (previewMode === "local") return "local";
  if (previewMode === "central") return "central";
  if (previewMode === "deployed") return "deployed";
  return localRunnerUrl ? "local" : "central";
}

export function localRunnerGuard(): { ok: boolean; error?: string } {
  const url = getEffectiveRunnerUrl();
  if (!url) {
    return {
      ok: false,
      error: "VisuDEV starten (im Projektordner: npm run dev), dann erneut versuchen.",
    };
  }
  return { ok: true };
}
