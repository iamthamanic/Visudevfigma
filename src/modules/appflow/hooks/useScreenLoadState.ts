/**
 * useScreenLoadState – Hook für Lade-Status und Logs der Screen-Iframes.
 * Setzt Timeouts, initiale Logs und stellt markScreenLoaded/markScreenFailed bereit.
 * Location: src/modules/appflow/hooks/useScreenLoadState.ts
 */

import { useState, useRef, useEffect, useCallback } from "react";
import type { Screen } from "../../../lib/visudev/types";
import { normalizePreviewUrl } from "../layout";

const SCREEN_LOAD_TIMEOUT_MS = 60_000;

const EMBEDDING_HINT =
  "Tipp: Wenn alle Screens mit Timeout fehlschlagen, blockiert die Preview-App vermutlich Iframe-Einbetten. " +
  "In der Preview-App (z. B. Vite/Express) X-Frame-Options entfernen oder CSP setzen: frame-ancestors 'self' http://localhost:5173 http://localhost:3000; " +
  "oder in vite.config.ts: server: { headers: { 'Content-Security-Policy': \"frame-ancestors 'self' *\" } }.";

/** Error -102 (Chromium) = ERR_CONNECTION_REFUSED – nichts hört auf die angegebene URL. */
export const SCREEN_FAIL_REASONS = {
  TIMEOUT:
    "Timeout (60 s). Wahrscheinliche Ursache: Preview-App blockiert Iframe-Einbetten (X-Frame-Options / CSP). In der Preview-App Einbetten erlauben (siehe Terminal-Log).",
  LOAD_ERROR:
    "Ladefehler (z. B. -102 = Verbindung verweigert). Nichts läuft unter der Basis-URL. Lokal: „Preview starten“ (Runner + npx visudev-runner). Deployed-URL: App muss unter dieser URL laufen.",
  NO_URL: "Keine URL: Basis-URL oder Screen-Pfad fehlt.",
} as const;

export type LoadLogEntry = {
  id: string;
  time: string;
  message: string;
  type?: "info" | "success" | "error";
};

export function useScreenLoadState(
  screens: Screen[],
  previewUrl: string,
  previewError: string | null | undefined,
): {
  screenLoadState: Record<string, "loading" | "loaded" | "failed">;
  screenFailReason: Record<string, string>;
  loadLogs: LoadLogEntry[];
  setLoadLogs: React.Dispatch<React.SetStateAction<LoadLogEntry[]>>;
  markScreenLoaded: (screenId: string, screenName?: string) => void;
  markScreenFailed: (screenId: string, reason: string, screenName?: string, url?: string) => void;
} {
  const [screenLoadState, setScreenLoadState] = useState<
    Record<string, "loading" | "loaded" | "failed">
  >({});
  const [screenFailReason, setScreenFailReason] = useState<Record<string, string>>({});
  const [loadLogs, setLoadLogs] = useState<LoadLogEntry[]>([]);
  const loadTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const embeddingHintLoggedRef = useRef(false);

  const markScreenLoaded = useCallback((screenId: string, screenName?: string) => {
    const t = loadTimeoutsRef.current.get(screenId);
    if (t) {
      clearTimeout(t);
      loadTimeoutsRef.current.delete(screenId);
    }
    const name = screenName ?? screenId;
    setLoadLogs((prev) => [
      ...prev,
      {
        id: `${screenId}-loaded-${Date.now()}`,
        time: new Date().toLocaleTimeString("de-DE"),
        message: `✓ ${name}: onLoad ausgelöst (Dokument geladen). Leere Karte? Dann blockiert die App Einbetten (X-Frame-Options/CSP) oder liefert leere Seite.`,
        type: "success" as const,
      },
    ]);
    setScreenLoadState((prev) =>
      prev[screenId] === "failed" ? prev : { ...prev, [screenId]: "loaded" },
    );
  }, []);

  const markScreenFailed = useCallback(
    (screenId: string, reason: string, screenName?: string, url?: string) => {
      const t = loadTimeoutsRef.current.get(screenId);
      if (t) {
        clearTimeout(t);
        loadTimeoutsRef.current.delete(screenId);
      }
      const name = screenName ?? screenId;
      const detail = url ? ` URL: ${url}` : "";
      setLoadLogs((prev) => [
        ...prev,
        {
          id: `${screenId}-failed-${Date.now()}`,
          time: new Date().toLocaleTimeString("de-DE"),
          message: `✗ ${name} fehlgeschlagen: ${reason}${detail}`,
          type: "error" as const,
        },
      ]);
      setScreenLoadState((prev) => ({ ...prev, [screenId]: "failed" }));
      setScreenFailReason((prev) => ({ ...prev, [screenId]: reason }));
    },
    [],
  );

  useEffect(() => {
    loadTimeoutsRef.current.forEach((t) => clearTimeout(t));
    loadTimeoutsRef.current.clear();
    embeddingHintLoggedRef.current = false;
    const initial: Record<string, "loading" | "loaded" | "failed"> = {};
    const reasons: Record<string, string> = {};
    const now = new Date().toLocaleTimeString("de-DE");
    const logEntries: LoadLogEntry[] = [];

    if (previewError && previewError.trim()) {
      logEntries.push({
        id: "preview-error",
        time: now,
        message: `Preview/Build fehlgeschlagen (exakte Fehlermeldung):\n${previewError.trim()}`,
        type: "error",
      });
    }

    const hasBaseUrl =
      (previewUrl || "").trim().startsWith("http://") ||
      (previewUrl || "").trim().startsWith("https://");
    if (!hasBaseUrl) {
      screens.forEach((s) => {
        initial[s.id] = "failed";
        reasons[s.id] = SCREEN_FAIL_REASONS.NO_URL;
      });
      logEntries.push({
        id: "no-base-url",
        time: now,
        message:
          "Basis-URL fehlt. Bitte „Preview starten“ (oder Seite neu laden) oder im Projekt eine Deployed-URL setzen.",
        type: "info",
      });
      setLoadLogs(logEntries);
      setScreenLoadState(initial);
      setScreenFailReason(reasons);
      return;
    }

    const screensWithUrl = screens.filter((s) => normalizePreviewUrl(previewUrl, s.path || "/"));
    logEntries.push({
      id: "step-start",
      time: now,
      message: `Schritt 1: Starte Ladevorgang für ${screensWithUrl.length} Screen(s). Basis-URL: ${previewUrl}. Timeout pro Screen: ${SCREEN_LOAD_TIMEOUT_MS / 1000} s.`,
      type: "info",
    });

    screens.forEach((s) => {
      const src = normalizePreviewUrl(previewUrl, s.path || "/");
      if (!src) {
        initial[s.id] = "failed";
        reasons[s.id] = SCREEN_FAIL_REASONS.NO_URL;
        logEntries.push({
          id: `${s.id}-no-url`,
          time: new Date().toLocaleTimeString("de-DE"),
          message: `✗ ${s.name} (${s.path || "/"}): Keine URL – Basis-URL oder Screen-Pfad fehlt. Basis-URL war: ${previewUrl || "(leer)"}`,
          type: "error",
        });
      } else {
        initial[s.id] = "loading";
        logEntries.push({
          id: `${s.id}-start`,
          time: new Date().toLocaleTimeString("de-DE"),
          message: `Schritt 2: Iframe für "${s.name}" (Pfad: ${s.path || "/"}) eingebunden. URL: ${src}. Warte auf onLoad oder Timeout.`,
          type: "info",
        });
        const t = setTimeout(() => {
          setScreenLoadState((prev) => ({ ...prev, [s.id]: "failed" }));
          setScreenFailReason((prev) => ({ ...prev, [s.id]: SCREEN_FAIL_REASONS.TIMEOUT }));
          setLoadLogs((prev) => {
            const next = [
              ...prev,
              {
                id: `${s.id}-timeout-${Date.now()}`,
                time: new Date().toLocaleTimeString("de-DE"),
                message: `✗ ${s.name} fehlgeschlagen: Timeout nach ${SCREEN_LOAD_TIMEOUT_MS / 1000} s (onLoad wurde nicht ausgelöst). Exakte URL: ${src}`,
                type: "error" as const,
              },
            ];
            if (!embeddingHintLoggedRef.current) {
              embeddingHintLoggedRef.current = true;
              next.push({
                id: `embedding-hint-${Date.now()}`,
                time: new Date().toLocaleTimeString("de-DE"),
                message: EMBEDDING_HINT,
                type: "info",
              });
            }
            return next;
          });
          loadTimeoutsRef.current.delete(s.id);
        }, SCREEN_LOAD_TIMEOUT_MS);
        loadTimeoutsRef.current.set(s.id, t);
      }
    });
    setLoadLogs(logEntries);
    setScreenLoadState(initial);
    setScreenFailReason(reasons);
    const timeouts = loadTimeoutsRef.current;
    return () => {
      timeouts.forEach((t) => clearTimeout(t));
      timeouts.clear();
    };
  }, [previewUrl, screens, previewError]);

  return {
    screenLoadState,
    screenFailReason,
    loadLogs,
    setLoadLogs,
    markScreenLoaded,
    markScreenFailed,
  };
}
