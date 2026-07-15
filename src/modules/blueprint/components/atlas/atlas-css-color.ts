/**
 * Resolve CSS color values to #rrggbb for WebGL/Three.js materials.
 * Location: src/modules/blueprint/components/atlas/
 */

/** Resolve a CSS color (oklch/hsl/hex) to #rrggbb for Three.js materials. */
export function cssColorToHex(cssColor: string): string {
  if (!cssColor || typeof document === "undefined") return "";
  if (/^#[0-9a-f]{3,8}$/i.test(cssColor)) return cssColor;
  const probe = document.createElement("span");
  probe.style.color = cssColor;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const resolvedRgb = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  const rgbMatch = resolvedRgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!rgbMatch) return "";
  const toHex = (channel: string) => Number(channel).toString(16).padStart(2, "0");
  return `#${toHex(rgbMatch[1])}${toHex(rgbMatch[2])}${toHex(rgbMatch[3])}`;
}

export function readCssColorVar(variableName: string): string {
  if (typeof window === "undefined") return "";
  const rawValue = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  return cssColorToHex(rawValue) || rawValue;
}
