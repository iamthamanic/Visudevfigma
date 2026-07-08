import { assertEquals } from "std/assert";
import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import { resolveRoutePath } from "./route-path.util.ts";
import {
  buildRouteScopeId,
  validateRouteScopes,
} from "../graph/route-scope.validate.ts";

Deno.test("validateRouteScopes keeps same method/path in different files", () => {
  const scopes = validateRouteScopes([
    {
      id: "GET /me@app/a.routes.ts:1",
      method: "GET",
      path: "/a/me",
      filePath: "app/a.routes.ts",
      line: 1,
      relatedFiles: ["app/a.routes.ts"],
    },
    {
      id: "GET /me@app/b.routes.ts:1",
      method: "GET",
      path: "/b/me",
      filePath: "app/b.routes.ts",
      line: 1,
      relatedFiles: ["app/b.routes.ts"],
    },
  ]);
  assertEquals(scopes.length, 2);
  const usedBaseIds = new Set<string>();
  assertEquals(
    scopes[0].id,
    buildRouteScopeId("GET", "/a/me", "app/a.routes.ts", 1, usedBaseIds),
  );
  assertEquals(
    scopes[1].id,
    buildRouteScopeId("GET", "/b/me", "app/b.routes.ts", 1, usedBaseIds),
  );
});

Deno.test("resolveRoutePath returns extracted paths without mount guessing", () => {
  const appFact: CodeFact = {
    id: "f-app",
    kind: "api-route",
    filePath: "leaves.routes.ts",
    line: 1,
    snippet: "app.get('/health')",
    metadata: {
      method: "GET",
      path: "/health",
      framework: "express",
    },
  };
  const routerFact: CodeFact = {
    id: "f-router",
    kind: "api-route",
    filePath: "leaves.routes.ts",
    line: 2,
    snippet: "router.get('/me')",
    metadata: {
      method: "GET",
      path: "/me",
      framework: "express",
    },
  };
  assertEquals(resolveRoutePath(appFact), "/health");
  assertEquals(resolveRoutePath(routerFact), "/me");
});
