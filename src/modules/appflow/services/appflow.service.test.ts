/**
 * Why: prove whitelist validation and port injection without mocking the global api facade.
 */
import { describe, expect, it, vi } from "vitest";
import {
  createFlow,
  deleteFlow,
  fetchFlows,
  normalizeProjectId,
  updateFlow,
  validateFlowCreateInput,
  validateFlowUpdateInput,
  type AppflowApiPort,
} from "./appflow.service";

function makePort(overrides: Partial<AppflowApiPort> = {}): AppflowApiPort {
  return {
    getAll: vi.fn().mockResolvedValue({ success: true, data: [] }),
    create: vi.fn().mockResolvedValue({ success: true }),
    update: vi.fn().mockResolvedValue({ success: true }),
    delete: vi.fn().mockResolvedValue({ success: true }),
    ...overrides,
  };
}

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("appflow.service", () => {
  it("rejects blank project ids", () => {
    expect(normalizeProjectId(" ")).toBeNull();
  });

  it("rejects invalid create payloads", () => {
    expect(validateFlowCreateInput(null as never).success).toBe(false);
    expect(validateFlowCreateInput({ flowId: "  " } as never).success).toBe(false);
    expect(validateFlowCreateInput({ flowId: "not-a-uuid" } as never).success).toBe(false);
    expect(validateFlowCreateInput({ unexpected: true } as never).success).toBe(false);
  });

  it("accepts empty create and whitelists known fields", () => {
    expect(validateFlowCreateInput({} as never).success).toBe(true);
    const withId = validateFlowCreateInput({ flowId: VALID_UUID, framework: "react" } as never);
    expect(withId.success).toBe(true);
    expect(withId.data).toEqual({ flowId: VALID_UUID, framework: "react" });
  });

  it("strips unknown nested screen fields", () => {
    const result = validateFlowCreateInput({
      screens: [{ id: "home", evil: true, name: "Home" }],
    } as never);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ screens: [{ id: "home", name: "Home" }] });
  });

  it("rejects empty or unknown update fields", () => {
    expect(validateFlowUpdateInput({} as never).success).toBe(false);
    expect(validateFlowUpdateInput({ flowId: VALID_UUID } as never).success).toBe(false);
  });

  it("delegates CRUD via port", async () => {
    const port = makePort();
    await fetchFlows("p1", port);
    await createFlow("p1", { flowId: VALID_UUID }, port);
    await updateFlow("p1", "f1", { framework: "vue" } as never, port);
    await deleteFlow("p1", "f1", port);
    expect(port.getAll).toHaveBeenCalledWith("p1");
    expect(port.create).toHaveBeenCalled();
    expect(port.update).toHaveBeenCalledWith("p1", "f1", { framework: "vue" });
    expect(port.delete).toHaveBeenCalledWith("p1", "f1");
  });
});
