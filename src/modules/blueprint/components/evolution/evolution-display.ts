/**
 * Safe display helpers for external snapshot/git strings in Evolution UI.
 */

export function formatSnapshotDate(capturedAt: string | undefined): string {
  if (!capturedAt || capturedAt.length < 10) return "—";
  const isoDate = capturedAt.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(isoDate) ? isoDate : "—";
}

export function displayText(value: string | undefined, maxLength = 120): string {
  if (!value?.trim()) return "—";
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

export function formatCommitSha(sha: string | undefined): string {
  if (!sha || sha.length < 8) return "—";
  return sha.slice(0, 8);
}
