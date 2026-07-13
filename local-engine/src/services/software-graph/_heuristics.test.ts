import { describe, expect, it } from "vitest";
import { detectDomain, detectLayer, detectModule, normalizePath } from "./_heuristics.js";

describe("software graph heuristics", () => {
  it("normalizes leading slashes", () => {
    expect(normalizePath("/src/routes/users.ts")).toBe("src/routes/users.ts");
  });

  it("detects domain from src path", () => {
    expect(detectDomain("src/modules/blueprint/page.tsx")).toBe("modules");
  });

  it("detects module from path segments", () => {
    expect(detectModule("src/routes/users.ts", "routes")).toBe("routes");
    expect(detectModule("src/routes/internal/admin.ts", "routes")).toBe("internal");
  });

  it("detects presentation layer for routes folder", () => {
    expect(detectLayer("src/routes/users.ts")).toBe("presentation");
  });

  it("detects data layer for repositories folder", () => {
    expect(detectLayer("src/repositories/user-repo.ts")).toBe("data");
  });
});
