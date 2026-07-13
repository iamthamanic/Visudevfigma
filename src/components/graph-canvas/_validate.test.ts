import { describe, it, expect } from "vitest";
import { validateGraphCanvasInput } from "./_validate.js";
import type { GraphCanvasEdge, GraphCanvasNode } from "./types.js";

describe("validateGraphCanvasInput", () => {
  it("drops unsafe node colors", () => {
    const result = validateGraphCanvasInput(
      [{ id: "n1", label: "API", kind: "service", color: "javascript:alert(1)" }],
      [],
    );
    expect(result.nodes[0]?.color).toBeUndefined();
  });

  it("treats non-array inputs as empty", () => {
    const result = validateGraphCanvasInput(
      null as unknown as GraphCanvasNode[],
      undefined as unknown as GraphCanvasEdge[],
    );
    expect(result.hasRenderableNodes).toBe(false);
  });

  it("drops invalid nodes and dangling edges", () => {
    const result = validateGraphCanvasInput(
      [
        { id: "n1", label: "OK", kind: "service" },
        { id: "", label: "Bad", kind: "service" },
      ],
      [{ id: "e1", source: "n1", target: "missing", kind: "calls" }],
    );

    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(0);
    expect(result.hasRenderableNodes).toBe(true);
  });

  it("drops edges whose ids collide with node ids", () => {
    const result = validateGraphCanvasInput(
      [{ id: "n1", label: "OK", kind: "service" }],
      [{ id: "n1", source: "n1", target: "n1", kind: "calls" }],
    );

    expect(result.edges).toHaveLength(0);
  });

  it("rejects overlong ids instead of truncating them onto other nodes", () => {
    const longId = "n".repeat(257);
    const result = validateGraphCanvasInput(
      [{ id: longId, label: "Long", kind: "service" }],
      [{ id: "e1", source: longId, target: longId, kind: "calls" }],
    );

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it("truncates long labels before rendering", () => {
    const longLabel = "l".repeat(200);
    const result = validateGraphCanvasInput([{ id: "n1", label: longLabel, kind: "service" }], []);

    expect(result.nodes[0]?.label).toHaveLength(96);
  });

  it("drops duplicate node ids at the canvas boundary", () => {
    const result = validateGraphCanvasInput(
      [
        { id: "n1", label: "First", kind: "service" },
        { id: "n1", label: "Duplicate", kind: "service" },
      ],
      [],
    );

    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]?.label).toBe("First");
  });

  it("caps oversized graph payloads at the configured limits", () => {
    const nodes = Array.from({ length: 2_501 }, (_, index) => ({
      id: `node-${index}`,
      label: `Node ${index}`,
      kind: "service",
    }));
    const result = validateGraphCanvasInput(nodes, []);

    expect(result.nodes).toHaveLength(2_500);
    expect(result.isLargeGraph).toBe(true);
  });
});
