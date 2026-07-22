/**
 * Why: prove projectId/payload validation and port injection without mocking the facade.
 */
import { describe, expect, it, vi } from "vitest";
import {
  fetchERD,
  fetchMigrations,
  fetchSchema,
  normalizeProjectId,
  saveERD,
  saveMigrations,
  saveSchema,
  type DataApiPort,
} from "./data.service";

function makePort(overrides: Partial<DataApiPort> = {}): DataApiPort {
  return {
    getSchema: vi.fn().mockResolvedValue({ success: true, data: {} }),
    updateSchema: vi.fn().mockResolvedValue({ success: true }),
    getMigrations: vi.fn().mockResolvedValue({ success: true, data: [] }),
    updateMigrations: vi.fn().mockResolvedValue({ success: true }),
    getERD: vi.fn().mockResolvedValue({ success: true, data: { nodes: [] } }),
    updateERD: vi.fn().mockResolvedValue({ success: true }),
    ...overrides,
  };
}

describe("data.service", () => {
  it("rejects blank project ids", () => {
    expect(normalizeProjectId(" ")).toBeNull();
  });

  it("fetches ERD via port", async () => {
    const port = makePort();
    const result = await fetchERD("p1", port);
    expect(result.success).toBe(true);
    expect(port.getERD).toHaveBeenCalledWith("p1");
  });

  it("rejects invalid schema/erd payloads", async () => {
    const port = makePort();
    expect((await saveSchema("p1", null as never, port)).success).toBe(false);
    expect((await saveERD("p1", [] as never, port)).success).toBe(false);
    expect(port.updateSchema).not.toHaveBeenCalled();
  });

  it("delegates schema/migrations updates", async () => {
    const port = makePort();
    await fetchSchema("p1", port);
    await saveSchema("p1", { a: 1 }, port);
    await fetchMigrations("p1", port);
    await saveMigrations("p1", [{ id: 1 }], port);
    expect(port.getSchema).toHaveBeenCalled();
    expect(port.updateSchema).toHaveBeenCalledWith("p1", { a: 1 });
    expect(port.updateMigrations).toHaveBeenCalledWith("p1", [{ id: 1 }]);
  });
});
