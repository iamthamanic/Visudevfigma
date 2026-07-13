/**
 * Reads graph color tokens from globals.css so Cytoscape matches DaisyUI theme
 * without hardcoding hex values in TS.
 */

import type cytoscape from "cytoscape";

const kindVariables: Record<string, string> = {
  runtime: "--color-graph-runtime",
  service: "--color-graph-service",
  database: "--color-graph-database",
  external: "--color-graph-external",
  file: "--color-graph-file",
  route: "--color-graph-route",
  domain: "--color-graph-domain",
  module: "--color-graph-module",
  symbol: "--color-graph-symbol",
};

export function getCssVariable(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function buildStylesheet(): cytoscape.StylesheetStyle[] {
  const nodeDefault = getCssVariable("--color-muted-foreground");
  const edgeColor = getCssVariable("--color-graph-edge");
  const labelColor = getCssVariable("--color-graph-label");
  const labelBg = getCssVariable("--color-background");
  const foreground = getCssVariable("--color-foreground");

  return [
    {
      selector: "node",
      style: {
        label: "data(label)",
        "background-color": (ele: cytoscape.NodeSingular) =>
          ele.data("color") || getCssVariable(kindVariables[ele.data("kind")]) || nodeDefault,
        color: foreground,
        "text-valign": "center",
        "text-halign": "center",
        "font-size": "12px",
        width: "label",
        height: "label",
        padding: "12px",
        "text-wrap": "wrap",
        "text-max-width": "120px",
      },
    },
    {
      selector: "edge",
      style: {
        width: 2,
        "line-color": edgeColor,
        "target-arrow-color": edgeColor,
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        label: "data(label)",
        color: labelColor,
        "font-size": "10px",
        "text-background-color": labelBg,
        "text-background-opacity": 0.8,
        "text-background-padding": "2px",
      },
    },
  ];
}
