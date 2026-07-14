/**
 * Vitest: demo graph thin detection and enrichment.
 */

import { describe, expect, it } from "vitest";
import type { SoftwareGraphNode } from "./software-graph.types.js";
import { buildHrToolDemoGraph } from "./demo-graph-seed.js";
import {
  DEMO_GRAPH_MIN_LAYERS,
  enrichSoftwareGraphIfThin,
  isThinSoftwareGraph,
} from "./demo-graph-thin.js";

describe("demo-graph-thin", () => {
  it("builds 7 architecture layers in demo seed", () => {
    const graph = buildHrToolDemoGraph("proj-demo");
    const layers = graph.nodes.filter((node) => node.kind === "layer");
    expect(layers.length).toBeGreaterThanOrEqual(DEMO_GRAPH_MIN_LAYERS);
  });

  it("enriches thin graphs", () => {
    const thin = buildHrToolDemoGraph("x");
    thin.nodes = thin.nodes.filter((node) => node.kind !== "layer");
    expect(isThinSoftwareGraph(thin)).toBe(true);
    const enriched = enrichSoftwareGraphIfThin(thin, "proj-demo");
    expect(enriched.nodes.filter((node) => node.kind === "layer").length).toBeGreaterThanOrEqual(
      DEMO_GRAPH_MIN_LAYERS,
    );
  });

  it("does not enrich graphs with layers, edges, groups, and snapshots", () => {
    const moduleNodes: SoftwareGraphNode[] = Array.from({ length: 22 }, (_, index) => ({
      id: `mod:${index}`,
      kind: "module",
      label: `module-${index}`,
      metadata: {},
    }));
    const layerNodes: SoftwareGraphNode[] = [
      "Experience Layer",
      "Application Layer",
      "Domain Layer",
      "Integration Layer",
      "Persistence Layer",
      "Processing Layer",
      "Platform Layer",
    ].map((label, index) => ({
      id: `layer:${index}`,
      kind: "layer" as const,
      label,
      metadata: {},
    }));
    const graph = {
      ...buildHrToolDemoGraph("p1"),
      nodes: [...moduleNodes, ...layerNodes],
      edges: Array.from({ length: 12 }, (_, index) => ({
        id: `edge:${index}`,
        kind: "contains" as const,
        sourceId: `mod:${index % 22}`,
        targetId: `mod:${(index + 1) % 22}`,
        metadata: {},
      })),
      groups: [{ id: "g1", kind: "module" as const, label: "core", nodeIds: ["mod:0"] }],
      snapshots: buildHrToolDemoGraph("p1").snapshots,
    };
    expect(isThinSoftwareGraph(graph)).toBe(false);
    const enriched = enrichSoftwareGraphIfThin(graph, "p1");
    expect(enriched.nodes.some((node) => node.id === "route:leave")).toBe(false);
  });
});
