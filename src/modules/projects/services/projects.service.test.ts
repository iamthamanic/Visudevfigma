/**
 * Why: prove whitelist validation and port injection without mocking the global api facade.
 */
import { describe, expect, it, vi } from "vitest";
import {
  createProject,
  deleteProject,
  fetchProject,
  fetchProjects,
  normalizeProjectId,
  updateProject,
  validateProjectCreateInput,
  validateProjectUpdateInput,
  type ProjectsApiPort,
} from "./projects.service";

function makePort(overrides: Partial<ProjectsApiPort> = {}): ProjectsApiPort {
  return {
    getAll: vi.fn().mockResolvedValue({ success: true, data: [] }),
    get: vi.fn().mockResolvedValue({ success: true, data: { id: "p1", name: "Demo" } }),
    create: vi.fn().mockResolvedValue({ success: true, data: { id: "p1", name: "Demo" } }),
    update: vi.fn().mockResolvedValue({ success: true }),
    delete: vi.fn().mockResolvedValue({ success: true }),
    ...overrides,
  };
}

describe("projects.service", () => {
  it("rejects blank project ids", () => {
    expect(normalizeProjectId(" ")).toBeNull();
  });

  it("rejects invalid create payloads", () => {
    expect(validateProjectCreateInput(null as never).success).toBe(false);
    expect(validateProjectCreateInput({} as never).success).toBe(false);
    expect(validateProjectCreateInput({ name: "  " } as never).success).toBe(false);
    expect(validateProjectCreateInput({ name: "ok", evil: true } as never).success).toBe(false);
  });

  it("accepts whitelisted create fields", () => {
    const result = validateProjectCreateInput({
      name: "Demo",
      source_mode: "github",
      github_repo: "org/repo",
    } as never);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      name: "Demo",
      source_mode: "github",
      github_repo: "org/repo",
    });
  });

  it("rejects empty update payloads", () => {
    expect(validateProjectUpdateInput({} as never).success).toBe(false);
  });

  it("delegates CRUD via port", async () => {
    const port = makePort();
    await fetchProjects(port);
    await fetchProject("p1", port);
    await createProject({ name: "Demo" } as never, port);
    await updateProject("p1", { name: "Renamed" } as never, port);
    await deleteProject("p1", port);
    expect(port.getAll).toHaveBeenCalled();
    expect(port.get).toHaveBeenCalledWith("p1");
    expect(port.create).toHaveBeenCalled();
    expect(port.update).toHaveBeenCalledWith("p1", { name: "Renamed" });
    expect(port.delete).toHaveBeenCalledWith("p1");
  });
});
