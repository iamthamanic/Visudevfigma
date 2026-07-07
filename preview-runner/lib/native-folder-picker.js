/**
 * Native folder picker for local VisuDEV (Preview-Runner on the same machine).
 * Location: preview-runner/lib/native-folder-picker.js
 */

import { execFile } from "node:child_process";
import { homedir, platform } from "node:os";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function escapeAppleScriptString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function pickMacFolder(defaultPath) {
  const start = defaultPath?.trim() || homedir();
  const script = `POSIX path of (choose folder with prompt "Projektordner wählen" default location POSIX file "${escapeAppleScriptString(start)}")`;
  try {
    const { stdout } = await execFileAsync("osascript", ["-e", script], {
      timeout: 300_000,
      maxBuffer: 4096,
    });
    const picked = stdout.trim().replace(/\/$/, "");
    if (!picked) return { cancelled: true };
    if (!picked.startsWith("/")) {
      return { error: `Ungültiger Ordnerpfad vom System: ${picked}` };
    }
    return { path: picked };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === 1) return { cancelled: true };
    const message = error instanceof Error ? error.message : String(error);
    return { error: message };
  }
}

async function pickLinuxFolder(defaultPath) {
  const start = defaultPath?.trim() || homedir();
  try {
    const { stdout } = await execFileAsync(
      "zenity",
      ["--file-selection", "--directory", "--title=Projektordner wählen", `--filename=${start}/`],
      { timeout: 300_000, maxBuffer: 4096 },
    );
    const picked = stdout.trim();
    if (!picked) return { cancelled: true };
    return { path: picked };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === 1) return { cancelled: true };
    return {
      error: "zenity nicht verfügbar. Pfad manuell eingeben oder zenity installieren (Linux).",
    };
  }
}

/**
 * @param {{ defaultPath?: string }} [options]
 * @returns {Promise<{ path?: string, cancelled?: boolean, error?: string }>}
 */
export async function pickNativeFolder(options = {}) {
  const os = platform();
  if (os === "darwin") return pickMacFolder(options.defaultPath);
  if (os === "linux") return pickLinuxFolder(options.defaultPath);
  return {
    error:
      "Native Ordnerauswahl ist auf dieser Plattform noch nicht verfügbar. Bitte Pfad manuell eingeben.",
  };
}
