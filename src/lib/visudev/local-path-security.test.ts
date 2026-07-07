import { mkdtempSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveValidatedLocalPath } from "../../../preview-runner/lib/local-path-security.js";

describe("resolveValidatedLocalPath", () => {
  it("rejects relative paths", () => {
    const result = resolveValidatedLocalPath("relative/path");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("absolute");
  });

  it("accepts a temp directory under home", () => {
    const dir = mkdtempSync(join(homedir(), "visudev-local-path-"));
    try {
      const result = resolveValidatedLocalPath(dir);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.path).toBeTruthy();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
