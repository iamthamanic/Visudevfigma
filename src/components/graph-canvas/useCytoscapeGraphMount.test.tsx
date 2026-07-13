import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ValidatedGraphCanvasInput } from "./_validate.js";
import { useCytoscapeGraphMount } from "./useCytoscapeGraphMount.js";
import type { MountedCytoscapeGraph } from "./_mount.js";
import { mountCytoscapeGraph } from "./_mount.js";

vi.mock("./_mount.js", () => ({
  mountCytoscapeGraph: vi.fn(),
}));

const baseValidated: ValidatedGraphCanvasInput = {
  nodes: [{ id: "n1", label: "API", kind: "service" }],
  edges: [],
  hasRenderableNodes: true,
  isLargeGraph: false,
};

function createMockMount(): MountedCytoscapeGraph {
  const destroy = vi.fn();
  const cleanup = vi.fn();
  return {
    graph: {
      destroy,
      on: vi.fn(),
      off: vi.fn(),
      fit: vi.fn(),
      zoom: vi.fn(() => 1),
      batch: vi.fn((callback: () => void) => callback()),
      elements: vi.fn(() => ({ forEach: vi.fn() })),
      getElementById: vi.fn(() => ({ empty: () => true, data: vi.fn() })),
      add: vi.fn(),
      remove: vi.fn(),
    } as unknown as MountedCytoscapeGraph["graph"],
    cleanup,
  };
}

describe("useCytoscapeGraphMount", () => {
  beforeEach(() => {
    vi.mocked(mountCytoscapeGraph).mockReset();
  });

  it("surfaces mount failures to initError", async () => {
    vi.mocked(mountCytoscapeGraph).mockRejectedValueOnce(new Error("mount failed"));
    const { result } = renderHook(() => useCytoscapeGraphMount(baseValidated));
    const container = document.createElement("div");

    act(() => {
      result.current.setContainerRef(container);
    });

    await waitFor(() => {
      expect(result.current.initError).toBe("Graph konnte nicht geladen werden.");
    });
  });

  it("skips attaching graph when unmounted before async mount resolves", async () => {
    let resolveMount: ((value: ReturnType<typeof createMockMount>) => void) | undefined;
    vi.mocked(mountCytoscapeGraph).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveMount = resolve;
        }),
    );

    const { result, unmount } = renderHook(() => useCytoscapeGraphMount(baseValidated));
    const container = document.createElement("div");

    act(() => {
      result.current.setContainerRef(container);
    });

    unmount();

    const mounted = createMockMount();
    await act(async () => {
      resolveMount?.(mounted);
      await Promise.resolve();
    });

    expect(mounted.cleanup).toHaveBeenCalled();
  });

  it("passes an isStale guard into mountCytoscapeGraph", async () => {
    const mounted = createMockMount();
    vi.mocked(mountCytoscapeGraph).mockResolvedValueOnce(mounted);

    const { result } = renderHook(() => useCytoscapeGraphMount(baseValidated));
    const container = document.createElement("div");

    act(() => {
      result.current.setContainerRef(container);
    });

    await waitFor(() => {
      expect(mountCytoscapeGraph).toHaveBeenCalled();
    });

    const isStale = vi.mocked(mountCytoscapeGraph).mock.calls[0]?.[3];
    expect(typeof isStale).toBe("function");
  });
});
