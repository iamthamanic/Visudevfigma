/**
 * usePreviewPostMessage – postMessage-Listener für Preview-Iframes (Fehler, DOM-Report, Navigation).
 * Location: src/modules/appflow/hooks/usePreviewPostMessage.ts
 */

import { useEffect } from "react";
import type { Screen } from "../../../lib/visudev/types";
import type { VisudevDomReport } from "../types";
import type { GraphEdge } from "../layout";
import { matchScreenPath, normalizeRoutePath } from "../layout";
import { SCREEN_FAIL_REASONS } from "./useScreenLoadState";

export function usePreviewPostMessage(
  iframeToScreenRef: React.MutableRefObject<Map<Window, string>>,
  screens: Screen[],
  edges: GraphEdge[],
  markScreenFailed: (screenId: string, reason: string, screenName?: string, url?: string) => void,
  setDomReportsByScreenId: React.Dispatch<React.SetStateAction<Record<string, VisudevDomReport>>>,
  setAnimatingEdge: (edge: GraphEdge | null) => void,
  onRuntimeNavigate: (sourceScreenId: string, targetPath: string) => GraphEdge | null,
): void {
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "visudev-preview-error") {
        const sourceScreenId = iframeToScreenRef.current.get(event.source as Window);
        const reason =
          typeof (data as { reason?: string }).reason === "string"
            ? (data as { reason: string }).reason
            : SCREEN_FAIL_REASONS.LOAD_ERROR;
        if (sourceScreenId) markScreenFailed(sourceScreenId, reason);
        return;
      }

      if (data.type === "visudev-dom-report") {
        const report = data as VisudevDomReport;
        if (typeof report.route !== "string") return;
        const sourceScreenId = iframeToScreenRef.current.get(event.source as Window);
        if (!sourceScreenId) return;
        setDomReportsByScreenId((prev) => ({ ...prev, [sourceScreenId]: report }));
        return;
      }

      if (data.type !== "visudev-navigate" || typeof data.path !== "string") return;
      const targetPath = normalizeRoutePath(data.path);
      const sourceScreenId = iframeToScreenRef.current.get(event.source as Window);
      if (!sourceScreenId) return;
      const runtimeEdge = onRuntimeNavigate(sourceScreenId, targetPath);
      if (runtimeEdge) {
        setAnimatingEdge(runtimeEdge);
        return;
      }
      const targetScreen = screens.find((s) => matchScreenPath(s.path || "/", targetPath));
      if (!targetScreen) return;
      const edge = edges.find((e) => e.fromId === sourceScreenId && e.toId === targetScreen.id);
      if (edge) setAnimatingEdge(edge);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [
    screens,
    edges,
    markScreenFailed,
    setDomReportsByScreenId,
    setAnimatingEdge,
    onRuntimeNavigate,
    iframeToScreenRef,
  ]);
}
