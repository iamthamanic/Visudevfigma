/** Redact repo paths and upstream errors before logging (Blueprint analyzer). */

export function redactRepoRef(repo: string): string {
  const trimmed = repo.trim();
  const slash = trimmed.indexOf("/");
  if (slash > 0) {
    return `${trimmed.slice(0, slash)}/***`;
  }
  return "repo:***";
}

export function redactFileRef(filePath: string): string {
  const name = filePath.split("/").pop() ?? "file";
  return `file:${name}`;
}

export function redactErrorKind(error: unknown): string {
  if (error instanceof Error) return error.name || "Error";
  return "unknown";
}
