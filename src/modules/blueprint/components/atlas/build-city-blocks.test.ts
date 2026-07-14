/**
 * Tests for Atlas city block layout.
 */

import { describe, it, expect } from "vitest";
import type { GraphCanvasNode } from "../../types";
import { buildCityBlocks } from "./build-city-blocks";

const nodes: GraphCanvasNode[] = [
  { id: "a", label: "auth", kind: "module" },
  { id: "b", label: "billing", kind: "service" },
];

describe("buildCityBlocks", () => {
  it("creates centered blocks for visible nodes", () => {
    const blocks = buildCityBlocks(nodes, []);
    expect(blocks).toHaveLength(2);
    expect(blocks.every((block) => block.height > 0)).toBe(true);
  });

  it("groups nodes into districts from graph groups", () => {
    const blocks = buildCityBlocks(nodes, [
      { id: "g1", kind: "module", label: "core", nodeIds: ["a", "b"] },
    ]);
    expect(blocks.every((block) => block.districtLabel === "core")).toBe(true);
  });
});
