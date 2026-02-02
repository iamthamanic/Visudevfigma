/**
 * Stub: appflow_scanner – echte Implementierung liegt in visudev-analyzer.
 * Dieser Stub verhindert Import-Fehler beim lokalen Supabase functions serve.
 * Für echte Scans wird die visudev-analyzer Edge Function genutzt.
 */

export interface ScanResult {
  screens: Array<{ id: string; name: string; path: string; depth?: number }>;
  flows: Array<unknown>;
  framework: string;
}

export function scanRepository(
  _owner: string,
  _repo: string,
  _branch: string,
  _token: string,
): Promise<ScanResult> {
  return Promise.resolve({
    screens: [],
    flows: [],
    framework: "unknown",
  });
}
