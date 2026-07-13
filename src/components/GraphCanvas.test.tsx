import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GraphCanvas } from "./GraphCanvas";

vi.mock("./graph-canvas/_mount.js", () => ({
  mountCytoscapeGraph: vi.fn(async () => ({
    graph: {
      destroy: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      fit: vi.fn(),
      zoom: vi.fn(() => 1),
      batch: vi.fn((callback: () => void) => callback()),
      elements: vi.fn(() => ({ forEach: vi.fn() })),
      getElementById: vi.fn(() => ({ empty: () => true, data: vi.fn() })),
      add: vi.fn(),
      remove: vi.fn(),
    },
    cleanup: vi.fn(),
  })),
}));

describe("GraphCanvas", () => {
  it("renders empty state when no nodes are provided", () => {
    render(<GraphCanvas nodes={[]} edges={[]} />);
    expect(screen.getByText("Keine Graph-Daten vorhanden.")).toBeInTheDocument();
  });

  it("renders canvas container when nodes exist", () => {
    const { container } = render(
      <GraphCanvas nodes={[{ id: "n1", label: "Node 1", kind: "service" }]} edges={[]} />,
    );
    expect(container.querySelector('[class*="canvas"]')).not.toBeNull();
  });

  it("mounts canvas when nodes arrive after an initial empty render", () => {
    const { container, rerender } = render(<GraphCanvas nodes={[]} edges={[]} />);
    expect(screen.getByText("Keine Graph-Daten vorhanden.")).toBeInTheDocument();

    rerender(<GraphCanvas nodes={[{ id: "n1", label: "Node 1", kind: "service" }]} edges={[]} />);
    expect(screen.queryByText("Keine Graph-Daten vorhanden.")).not.toBeInTheDocument();
    expect(container.querySelector('[class*="canvas"]')).not.toBeNull();
  });
});
