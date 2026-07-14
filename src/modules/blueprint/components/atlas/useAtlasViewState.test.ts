/**
 * Tests for Atlas view mode sync with prefers-reduced-motion changes.
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BlueprintData } from "../../types";
import { useAtlasViewState } from "./useAtlasViewState.js";

const graph: NonNullable<BlueprintData["graph"]> = {
  version: 1,
  projectId: "p1",
  analyzedAt: "2026-01-01T00:00:00.000Z",
  scopes: [],
  nodes: [{ id: "m1", kind: "module", label: "auth", metadata: {} }],
  edges: [],
  evidence: [],
  groups: [],
  metrics: [],
  condensed: false,
  limits: { maxNodes: 2500, maxEdges: 5000 },
};

describe("useAtlasViewState", () => {
  let listeners: Array<() => void>;
  let matches = false;

  beforeEach(() => {
    listeners = [];
    matches = false;
    vi.stubGlobal("matchMedia", (query: string) => ({
      get matches() {
        return matches;
      },
      media: query,
      addEventListener: (_event: string, listener: () => void) => {
        listeners.push(listener);
      },
      removeEventListener: (_event: string, listener: () => void) => {
        listeners = listeners.filter((item) => item !== listener);
      },
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const emitMediaChange = (nextMatches: boolean) => {
    matches = nextMatches;
    act(() => {
      listeners.forEach((listener) => listener());
    });
  };

  it("defaults to 3d when reduced motion is off", () => {
    const { result } = renderHook(() => useAtlasViewState(graph));
    expect(result.current.viewMode).toBe("3d");
    expect(result.current.threeDisabled).toBe(false);
  });

  it("syncs viewMode to 2d when reduced motion turns on after mount", () => {
    const { result } = renderHook(() => useAtlasViewState(graph));
    emitMediaChange(true);
    expect(result.current.threeDisabled).toBe(true);
    expect(result.current.viewMode).toBe("2d");
  });

  it("syncs viewMode back to 3d when reduced motion turns off after mount", () => {
    matches = true;
    const { result } = renderHook(() => useAtlasViewState(graph));
    expect(result.current.viewMode).toBe("2d");
    emitMediaChange(false);
    expect(result.current.threeDisabled).toBe(false);
    expect(result.current.viewMode).toBe("3d");
  });

  it("blocks manual 3d selection while reduced motion is on", () => {
    matches = true;
    const { result } = renderHook(() => useAtlasViewState(graph));
    act(() => result.current.handleSelectViewMode("3d"));
    expect(result.current.viewMode).toBe("2d");
  });
});
