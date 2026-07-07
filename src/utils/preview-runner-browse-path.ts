/**
 * Opens native folder picker via local Preview-Runner (macOS/Linux).
 * Location: src/utils/preview-runner-browse-path.ts
 */

import { discoverRunnerUrl } from "./preview-runner-core";
import { getEffectiveRunnerUrl, localRunnerGuard } from "./preview-runner-mode";
import { parseRunnerJsonText } from "./preview-runner-parser";

export interface BrowseLocalFolderResult {
  success: boolean;
  path?: string;
  cancelled?: boolean;
  error?: string;
}

export async function browseLocalFolderViaRunner(
  startDir?: string,
): Promise<BrowseLocalFolderResult> {
  const guard = localRunnerGuard();
  if (!guard.ok) {
    return {
      success: false,
      error: guard.error ?? "Preview-Runner nicht erreichbar. npm run dev starten.",
    };
  }

  let base = getEffectiveRunnerUrl().replace(/\/$/, "");
  const qs = startDir && startDir.trim() ? `?startDir=${encodeURIComponent(startDir.trim())}` : "";

  const doFetch = async (urlBase: string): Promise<Response> => {
    return fetch(`${urlBase}/browse-local-path${qs}`, { method: "GET" });
  };

  let res: Response;
  try {
    res = await doFetch(base);
  } catch {
    const found = await discoverRunnerUrl();
    if (!found) {
      return { success: false, error: "Preview-Runner nicht erreichbar." };
    }
    base = found.replace(/\/$/, "");
    res = await doFetch(base);
  }

  const text = await res.text();
  const payload = parseRunnerJsonText(text, "Runner /browse-local-path");
  if (!payload || typeof payload !== "object") {
    return { success: false, error: "Ungültige Runner-Antwort" };
  }

  const record = payload as {
    success?: boolean;
    cancelled?: boolean;
    path?: string;
    error?: string;
  };

  if (record.cancelled) {
    return { success: true, cancelled: true };
  }
  if (!res.ok || record.success === false) {
    return {
      success: false,
      error: record.error ?? `Runner-Fehler (${res.status})`,
    };
  }
  if (typeof record.path !== "string" || !record.path.trim()) {
    return { success: false, error: "Runner lieferte keinen Pfad" };
  }

  return { success: true, path: record.path.trim() };
}
