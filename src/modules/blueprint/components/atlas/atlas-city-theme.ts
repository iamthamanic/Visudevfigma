/**
 * Reads Atlas 3D theme colors from CSS variables (no hardcoded hex in TS).
 */

export interface AtlasCityTheme {
  background: string;
  ground: string;
  blockDefault: string;
  blockSelected: string;
}

function readCssVariable(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function getAtlasCityTheme(): AtlasCityTheme {
  return {
    background: readCssVariable("--color-background"),
    ground: readCssVariable("--color-muted"),
    blockDefault: readCssVariable("--color-muted-foreground"),
    blockSelected: readCssVariable("--color-primary"),
  };
}
