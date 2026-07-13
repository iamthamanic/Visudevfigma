import { describe, expect, it } from "vitest";
import { buildLayoutOptions, MAX_DAGRE_NODES } from "./_layout";

describe("buildLayoutOptions", () => {
  it("uses dagre for moderate graphs", () => {
    expect(buildLayoutOptions(MAX_DAGRE_NODES).name).toBe("dagre");
  });

  it("uses grid layout for large graphs", () => {
    expect(buildLayoutOptions(MAX_DAGRE_NODES + 1).name).toBe("grid");
  });

  it("falls back to dagre for invalid node counts", () => {
    expect(buildLayoutOptions(Number.NaN).name).toBe("dagre");
    expect(buildLayoutOptions(-1).name).toBe("dagre");
  });
});
