const kindVariables: Record<string, string> = {
  domain: "--color-graph-arch-domain",
  layer: "--color-graph-arch-layer",
  module: "--color-graph-arch-module",
  route: "--color-graph-route",
  service: "--color-graph-service",
  repository: "--color-graph-repository",
  table: "--color-graph-database",
  file: "--color-graph-file",
};

function readCssVariable(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function getArchitectureKindColor(kind: string): string | undefined {
  const variable = kindVariables[kind];
  if (!variable) return undefined;
  const value = readCssVariable(variable);
  return value || undefined;
}
