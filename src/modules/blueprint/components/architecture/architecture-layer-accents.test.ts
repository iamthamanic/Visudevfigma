/**
 * Tests for architecture layer accent resolution.
 */

import { describe, it, expect } from "vitest";
import {
  ARCHITECTURE_LAYER_TYPES,
  resolveLayerType,
  layerTypeCssVar,
} from "./architecture-layer-accents.js";

describe("architecture-layer-accents", () => {
  it("defines seven canonical layer types", () => {
    expect(ARCHITECTURE_LAYER_TYPES).toHaveLength(7);
  });

  it("resolves known layer labels", () => {
    expect(resolveLayerType("presentation")).toBe("presentation");
    expect(resolveLayerType("UI")).toBe("ui");
  });

  it("returns unknown for non-layer labels", () => {
    expect(resolveLayerType("routes")).toBe("unknown");
  });

  it("maps layer types to css variables", () => {
    expect(layerTypeCssVar("data")).toBe("--color-arch-layer-data");
    expect(layerTypeCssVar("unknown")).toBe("--color-graph-arch-layer");
  });
});
