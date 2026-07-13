export const runtimeVariables: Record<string, string> = {
  browser: "--color-graph-runtime-browser",
  server: "--color-graph-runtime-server",
  edge: "--color-graph-runtime-edge",
  shared: "--color-graph-runtime-shared",
};

export function getCssVariable(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function getRuntimeColor(runtime: string): string {
  return getCssVariable(runtimeVariables[runtime]) || getCssVariable(runtimeVariables.shared);
}

export function getNodeKindColor(kind: string): string | undefined {
  if (kind === "table") return getCssVariable("--color-graph-database");
  if (kind === "external") return getCssVariable("--color-graph-external");
  return undefined;
}
