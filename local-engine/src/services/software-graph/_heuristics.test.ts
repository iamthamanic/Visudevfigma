import { describe, expect, it } from "vitest";
import { detectDomain, detectLayer, detectModule, normalizePath } from "./_heuristics.js";

describe("software graph heuristics", () => {
  it("normalizes leading slashes", () => {
    expect(normalizePath("/src/routes/users.ts")).toBe("src/routes/users.ts");
  });

  it("detects domain from src path", () => {
    expect(detectDomain("src/modules/blueprint/page.tsx")).toBe("modules");
  });

  it("detects monorepo apps/packages domains", () => {
    expect(detectDomain("apps/web/app/page.tsx")).toBe("apps/web");
    expect(detectDomain("packages/database/schema.prisma")).toBe("packages/database");
    expect(detectDomain("apps/api/plane/urls.py")).toBe("apps/api");
  });

  it("detects module from path segments", () => {
    expect(detectModule("src/routes/users.ts", "routes")).toBe("routes");
    expect(detectModule("src/routes/internal/admin.ts", "routes")).toBe("internal");
  });

  it("detects presentation layer for routes folder", () => {
    expect(detectLayer("src/routes/users.ts")).toBe("presentation");
  });

  it("detects Next app router and prisma as real layers (Softort)", () => {
    expect(detectLayer("apps/web/app/health/route.ts")).toBe("presentation");
    expect(detectLayer("apps/web/app/(app)/page.tsx")).toBe("presentation");
    expect(detectLayer("packages/database/schema.prisma")).toBe("data");
    expect(detectLayer("apps/api/plane/urls.py")).toBe("presentation");
    expect(detectLayer("apps/api/plane/models.py")).toBe("data");
  });

  it("detects data layer for repositories folder", () => {
    expect(detectLayer("src/repositories/user-repo.ts")).toBe("data");
  });
});
