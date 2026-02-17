export function warnNonFatal(context, error) {
  const message = error instanceof Error ? error.message : String(error ?? "unknown");
  console.warn(`[preview-runner] ${context}: ${message}`);
}
