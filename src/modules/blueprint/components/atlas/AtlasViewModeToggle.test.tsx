/**
 * Tests for Atlas 2D | 3D view mode toggle.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AtlasViewModeToggle } from "./AtlasViewModeToggle";

describe("AtlasViewModeToggle", () => {
  it("calls onSelectMode for 2D and 3D", () => {
    const onSelectMode = vi.fn();
    render(<AtlasViewModeToggle mode="2d" threeDisabled={false} onSelectMode={onSelectMode} />);
    fireEvent.click(screen.getByRole("button", { name: "3D" }));
    expect(onSelectMode).toHaveBeenCalledWith("3d");
  });

  it("disables 3D when reduced motion is active", () => {
    render(<AtlasViewModeToggle mode="2d" threeDisabled onSelectMode={vi.fn()} />);
    expect(screen.getByRole("button", { name: "3D" })).toBeDisabled();
  });
});
