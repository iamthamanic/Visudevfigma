/**
 * Clipboard helper with explicit success/error result (no silent failures).
 */

export type ClipboardCopyResult = "copied" | "error";

export function isClipboardWriteAvailable(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard?.writeText === "function" &&
    typeof window !== "undefined" &&
    window.isSecureContext === true
  );
}

export async function copyTextToClipboard(text: string): Promise<ClipboardCopyResult> {
  if (!text || !isClipboardWriteAvailable()) return "error";
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "error";
  }
}
