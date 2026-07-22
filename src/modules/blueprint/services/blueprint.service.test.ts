/**
 * Why: prove whitelist validation and port injection without mocking the facade.
 */
import { describe, expect, it, vi } from "vitest";
import {
  fetchBlueprint,
  normalizeProjectId,
  saveBlueprint,
  validateBlueprintUpdateInput,
  type BlueprintApiPort,
} from "./blueprint.service";

function makePort(overrides: Partial<BlueprintApiPort> = {}): BlueprintApiPort {
  return {
    get: vi.fn().mockResolvedValue({ success: true, data: { projectId: "p1" } }),
    update: vi.fn().mockResolvedValue({ success: true }),
    ...overrides,
  };
}

describe("blueprint.service", () => {
  it("rejects blank project ids", () => {
    expect(normalizeProjectId(" ")).toBeNull();
  });

  it("rejects invalid update payloads", () => {
    expect(validateBlueprintUpdateInput(null as never).success).toBe(false);
    expect(validateBlueprintUpdateInput({} as never).success).toBe(false);
    expect(validateBlueprintUpdateInput({ evil: true } as never).success).toBe(false);
    expect(validateBlueprintUpdateInput({ components: "x" } as never).success).toBe(false);
    expect(validateBlueprintUpdateInput({ components: [{ name: "" }] } as never).success).toBe(
      false,
    );
  });

  it("accepts whitelisted update fields", () => {
    const result = validateBlueprintUpdateInput({
      components: [{ name: "App", type: "page" }],
    } as never);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ components: [{ name: "App", type: "page" }] });
  });

  it("delegates get/update via port", async () => {
    const port = makePort();
    await fetchBlueprint("p1", port);
    await saveBlueprint("p1", { components: [{ name: "App" }] } as never, port);
    expect(port.get).toHaveBeenCalledWith("p1");
    expect(port.update).toHaveBeenCalledWith("p1", { components: [{ name: "App" }] });
  });
});
