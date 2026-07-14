import { describe, expect, it } from "vitest";
import { buildLayoutOptions, MAX_DAGRE_NODES } from "./_layout";

describe("buildLayoutOptions", () => {
  it("uses dagre for moderate graphs", () => {
    expect(buildLayoutOptions(MAX_DAGRE_NODES).name).toBe("dagre");
  });

  it("uses hierarchical dagre preset with top-to-bottom rank", () => {
    const options = buildLayoutOptions(10, true, "hierarchical");
    expect(options.name).toBe("dagre");
    expect((options as { rankDir?: string }).rankDir).toBe("TB");
  });

  it("uses cose force preset when requested", () => {
    const options = buildLayoutOptions(10, true, "force");
    expect(options.name).toBe("cose");
  });

  it("uses grid layout for large graphs", () => {
    expect(buildLayoutOptions(MAX_DAGRE_NODES + 1).name).toBe("grid");
  });

  it("falls back to dagre for invalid node counts", () => {
    expect(buildLayoutOptions(Number.NaN).name).toBe("dagre");
    expect(buildLayoutOptions(-1).name).toBe("dagre");
  });
});
