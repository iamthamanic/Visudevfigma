import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

const graphVariables: Record<string, string> = {
  "--color-foreground": "#ffffff",
  "--color-muted-foreground": "#a0a0a0",
  "--color-background": "#000000",
  "--color-graph-runtime": "#8b5cf6",
  "--color-graph-service": "#03ffa3",
  "--color-graph-database": "#af52de",
  "--color-graph-external": "#999999",
  "--color-graph-file": "#00d4ff",
  "--color-graph-route": "#ff9500",
  "--color-graph-domain": "#e5e5e5",
  "--color-graph-module": "#cccccc",
  "--color-graph-symbol": "#ffffff",
  "--color-graph-edge": "#333333",
  "--color-graph-label": "#a0a0a0",
  "--color-graph-runtime-browser": "#03ffa3",
  "--color-graph-runtime-server": "#00d4ff",
  "--color-graph-runtime-edge": "#8b5cf6",
  "--color-graph-runtime-shared": "#a0a0a0",
};

if (typeof document !== "undefined") {
  for (const [name, value] of Object.entries(graphVariables)) {
    document.documentElement.style.setProperty(name, value);
  }
}
