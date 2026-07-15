/**
 * Clipboard copy feedback state for blueprint detail panels.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { copyTextToClipboard } from "../../../lib/copy-to-clipboard.js";

export type CopyFeedbackStatus = "idle" | "copied" | "error";

export function useCopyFeedback(): {
  copyStatus: CopyFeedbackStatus;
  copyText: (text: string) => Promise<void>;
} {
  const [copyStatus, setCopyStatus] = useState<CopyFeedbackStatus>("idle");
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
    };
  }, []);

  const copyText = useCallback(async (text: string) => {
    if (!text) return;
    const result = await copyTextToClipboard(text);
    setCopyStatus(result === "copied" ? "copied" : "error");
    if (copyResetRef.current) clearTimeout(copyResetRef.current);
    copyResetRef.current = setTimeout(() => setCopyStatus("idle"), 2000);
  }, []);

  return { copyStatus, copyText };
}
