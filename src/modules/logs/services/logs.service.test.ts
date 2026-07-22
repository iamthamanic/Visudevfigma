/**
 * Why: prove validation and port injection without mocking the global api facade.
 */
import { describe, expect, it, vi } from "vitest";
import {
  createProjectLog,
  deleteAllProjectLogs,
  fetchProjectLogs,
  normalizeProjectId,
  validateLogCreateInput,
  type LogsApiPort,
} from "./logs.service";

function makePort(overrides: Partial<LogsApiPort> = {}): LogsApiPort {
  return {
    getAll: vi.fn().mockResolvedValue({ success: true, data: [] }),
    create: vi.fn().mockResolvedValue({ success: true }),
    deleteAll: vi.fn().mockResolvedValue({ success: true }),
    ...overrides,
  };
}

describe("logs.service", () => {
  it("rejects blank project ids", () => {
    expect(normalizeProjectId("  ")).toBeNull();
  });

  it("sanitizes create payloads and rejects bad levels", () => {
    expect(validateLogCreateInput({ message: 1 } as never).success).toBe(false);
    expect(validateLogCreateInput({} as never).success).toBe(false);
    expect(validateLogCreateInput({ message: "  " }).success).toBe(false);
    expect(validateLogCreateInput({ level: "TRACE" } as never).success).toBe(false);
    const ok = validateLogCreateInput({
      message: "hi",
      level: "info",
      extra: true,
    } as never);
    expect(ok.success).toBe(true);
    expect(ok.data).toEqual({ message: "hi", level: "INFO" });
  });

  it("returns logs on successful fetch via port arg", async () => {
    const port = makePort({
      getAll: vi.fn().mockResolvedValue({
        success: true,
        data: [{ id: "1", timestamp: "t", projectId: "p", message: "hi" }],
      }),
    });
    const result = await fetchProjectLogs("p", port);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(port.getAll).toHaveBeenCalledWith("p");
  });

  it("surfaces API errors from fetch", async () => {
    const result = await fetchProjectLogs(
      "p",
      makePort({
        getAll: vi.fn().mockResolvedValue({ success: false, error: "boom" }),
      }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("boom");
  });

  it("create and deleteAll delegate to the port after validation", async () => {
    const port = makePort();
    await createProjectLog("p", { message: "x" }, port);
    await deleteAllProjectLogs("p", port);
    expect(port.create).toHaveBeenCalledWith("p", { message: "x" });
    expect(port.deleteAll).toHaveBeenCalledWith("p");
  });

  it("does not call port.create for invalid payloads", async () => {
    const port = makePort();
    const result = await createProjectLog("p", { message: 1 } as never, port);
    expect(result.success).toBe(false);
    expect(port.create).not.toHaveBeenCalled();
  });
});
